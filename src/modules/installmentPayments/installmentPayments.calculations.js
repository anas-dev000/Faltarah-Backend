/**
 * Installment Payments Calculations Module
 * يتعامل مع جميع الحسابات المتعلقة بالأقساط الشهرية
 */

/**
 * حساب حالة القسط بناءً على مبلغ الدفع
 */
export function calculatePaymentStatus(amountPaid, amountDue) {
  if (amountPaid >= amountDue) {
    return "Paid"; // مدفوع بالكامل
  }

  if (amountPaid > 0 && amountPaid < amountDue) {
    return "Partial"; // مدفوع جزئياً
  }

  return "Pending"; // لم يتم الدفع
}

/**
 * حساب المبلغ المتبقي للترحيل
 */
export function calculateCarryoverAmount(amountPaid, amountDue) {
  const remaining = amountDue - amountPaid;
  return Math.max(0, remaining);
}

/**
 * حساب المبلغ المتأخر
 */
export function calculateOverdueAmount(paymentStatus, carryoverAmount) {
  if (paymentStatus === "Partial") {
    return carryoverAmount; // المتبقي من القسط الحالي
  }

  if (paymentStatus === "Pending") {
    return 0; // لم يتم دفع شيء بعد
  }

  return 0; // القسط مدفوع بالكامل
}

/**
 * معالجة الدفع وإرجاع بيانات القسط الجديد
 * هذه الدالة تعالج السيناريوهات:
 * 1. دفع كامل القسط -> إنشاء قسط جديد بحالة Pending
 * 2. دفع جزئي -> إنشاء قسط جديد برصيد + المتبقي
 * 3. محاولة دفع أكثر من المبلغ المستحق -> رفع خطأ
 */
export function processPaymentAndCreateNext(payment, amountPaid, installment) {
  // التحقق من عدم تجاوز المبلغ
  if (amountPaid > payment.amountDue) {
    throw new Error(
      `المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المستحق (${payment.amountDue} جنيه)`
    );
  }

  // حساب حالة القسط الحالي
  const currentPaymentStatus = calculatePaymentStatus(
    amountPaid,
    payment.amountDue
  );
  const carryover = calculateCarryoverAmount(amountPaid, payment.amountDue);

  // بيانات تحديث القسط الحالي (إغلاقه)
  const currentPaymentUpdate = {
    amountPaid,
    status: currentPaymentStatus,
    carryoverAmount: carryover,
    overdueAmount: carryover,
    paymentDate: new Date(),
  };

  // بيانات القسط التالي
  let nextPaymentDueDate = new Date(payment.dueDate);
  nextPaymentDueDate.setMonth(nextPaymentDueDate.getMonth() + 1);

  // ⭐ FIX: حساب المبلغ المستحق للقسط التالي بشكل صحيح
  const nextPaymentAmount =
    currentPaymentStatus === "Paid"
      ? parseFloat(installment.monthlyInstallment) // القسط العادي
      : parseFloat(installment.monthlyInstallment) + carryover; // القسط + الرصيد المرحل

  const nextPayment = {
    installmentId: payment.installmentId,
    customerId: payment.customerId,
    amountDue: nextPaymentAmount,
    amountPaid: 0,
    status: "Pending",
    carryoverAmount: 0,
    overdueAmount: 0,
    dueDate: nextPaymentDueDate,
    paymentDate: null,
    notes:
      payment.notes ||
      `قسط متتالي - ${
        carryover > 0
          ? `برصيد مرحل: ${carryover.toFixed(2)} جنيه`
          : "بدون أرصدة مرحلة"
      }`,
  };

  return {
    currentPaymentUpdate,
    nextPayment,
  };
}

/**
 * حساب عدد الأشهر المتبقية من التقسيط
 */
export function calculateRemainingMonths(installment, totalPayments) {
  const paidMonths = totalPayments.filter((p) => p.status === "Paid").length;

  return Math.max(0, installment.numberOfMonths - paidMonths);
}

/**
 * حساب المبلغ الإجمالي المتبقي
 */
export function calculateTotalRemaining(installment, totalPayments) {
  const paidAmount = totalPayments.reduce(
    (sum, p) => sum + (parseFloat(p.amountPaid) || 0),
    0
  );

  const totalAmount =
    installment.monthlyInstallment * installment.numberOfMonths;

  return Math.max(0, totalAmount - paidAmount);
}

/**
 * حساب المبلغ الإجمالي المدفوع
 */
export function calculateTotalPaid(totalPayments) {
  return totalPayments.reduce(
    (sum, p) => sum + (parseFloat(p.amountPaid) || 0),
    0
  );
}

/**
 * التحقق من أن القسط مغلق (لا يمكن تعديله)
 */
export function isPaymentClosed(payment) {
  return payment.status === "Paid" || payment.status === "Partial";
}

/**
 * الحصول على القسط التالي المتاح للدفع
 */
export function getNextPayablePayment(payments) {
  return (
    payments
      .filter((p) => p.status === "Pending")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null
  );
}

/**
 * حساب تاريخ الاستحقاق التالي
 */
export function calculateNextDueDate(currentDueDate) {
  const nextDate = new Date(currentDueDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

/**
 * التحقق من تأخر القسط
 */
export function isPaymentOverdue(dueDate, status) {
  if (status !== "Pending") {
    return false;
  }

  return new Date(dueDate) < new Date();
}

/**
 * حساب أيام التأخير
 */
export function calculateOverdueDays(dueDate) {
  if (new Date(dueDate) >= new Date()) {
    return 0;
  }

  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * معلومات تلخيصية عن حالة الأقساط
 */
export function getInstallmentSummary(payments, installment) {
  const paidPayments = payments.filter((p) => p.status === "Paid");
  const partialPayments = payments.filter((p) => p.status === "Partial");
  const pendingPayments = payments.filter((p) => p.status === "Pending");
  const overduePayments = pendingPayments.filter((p) =>
    isPaymentOverdue(p.dueDate, p.status)
  );

  const totalPaid = calculateTotalPaid(payments);
  const totalAmount =
    installment.monthlyInstallment * installment.numberOfMonths;
  const totalRemaining = calculateTotalRemaining(installment, payments);
  const remainingMonths = calculateRemainingMonths(installment, payments);

  return {
    totalPaid,
    totalAmount,
    totalRemaining,
    remainingMonths,
    paidMonths: paidPayments.length,
    partialMonths: partialPayments.length,
    pendingMonths: pendingPayments.length,
    overdueMonths: overduePayments.length,
    percentagePaid: (totalPaid / totalAmount) * 100,
    nextDueDate: getNextPayablePayment(payments)?.dueDate || null,
  };
}
