import * as installmentPaymentsRepository from "./installmentPayments.repository.js";
import * as calculations from "./installmentPayments.calculations.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ERROR_CODES } from "../../shared/errors/errorCodes.js";

/**
 * Get all installment payments
 */
export async function getAllPayments(prisma, currentUser, filters = {}) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentPaymentsRepository.findAllPayments(
    prisma,
    targetCompanyId,
    filters
  );
}

/**
 * Get payment by ID
 */
export async function getPaymentById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const payment = await installmentPaymentsRepository.findPaymentById(
    prisma,
    id,
    targetCompanyId
  );

  if (!payment) {
    throw new AppError(
      "Payment not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return payment;
}

/**
 * Count pending payments
 */
export async function countPendingPayments(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentPaymentsRepository.countPendingPayments(
    prisma,
    targetCompanyId
  );
}

/**
 * Count overdue payments
 */
export async function countOverduePayments(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentPaymentsRepository.countOverduePayments(
    prisma,
    targetCompanyId
  );
}

/**
 * Create installment payment (للقسط الأول فقط)
 */
export async function createPayment(prisma, data, currentUser) {
  const { role, companyId } = currentUser;

  // التحقق من الصلاحيات
  if (role !== "manager" && role !== "developer") {
    throw new AppError(
      "Only managers and developers can create payments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // التحقق من وجود الخطة الشهرية
  const installment = await prisma.installment.findUnique({
    where: { id: data.installmentId },
    include: { invoice: true },
  });

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // التحقق من الصلاحيات (المدير فقط يمكنه العمل مع شركته)
  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only create payments for your company's installments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // التحقق من تطابق بيانات العميل
  if (data.customerId !== installment.invoice.customerId) {
    throw new AppError(
      "Customer ID does not match the installment's customer",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // التحقق من عدم وجود أقساط سابقة
  const existingPayments =
    await installmentPaymentsRepository.findPaymentsByInstallmentId(
      prisma,
      data.installmentId
    );

  if (existingPayments.length > 0) {
    throw new AppError(
      "Payments for this installment already exist. Use update payment instead.",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // حساب حالة القسط
  const amountPaid = parseFloat(data.amountPaid) || 0;
  const amountDue = parseFloat(data.amountDue);

  if (amountPaid > amountDue) {
    throw new AppError(
      `Amount paid cannot exceed the amount due (${amountDue} EGP)`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const status = calculations.calculatePaymentStatus(amountPaid, amountDue);
  const carryoverAmount = calculations.calculateCarryoverAmount(
    amountPaid,
    amountDue
  );

  const paymentData = {
    installmentId: data.installmentId,
    customerId: data.customerId,
    amountDue,
    amountPaid,
    status,
    carryoverAmount,
    overdueAmount: carryoverAmount,
    dueDate: new Date(data.dueDate),
    paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
    notes: data.notes || null,
  };

  return await installmentPaymentsRepository.createPayment(prisma, paymentData);
}

/**
 * Update installment payment (الدفع على قسط موجود)
 * هذه الدالة تنفذ السيناريو الكامل:
 * 1. تحديث القسط الحالي
 * 2. إنشاء قسط جديد إذا لزم الأمر
 * 3. ترحيل الأرصدة
 */
export async function updatePayment(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  // التحقق من الصلاحيات
  if (role !== "manager" && role !== "developer") {
    throw new AppError(
      "Only managers and developers can update payments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // الحصول على القسط الحالي
  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const payment = await installmentPaymentsRepository.findPaymentById(
    prisma,
    id,
    targetCompanyId
  );

  if (!payment) {
    throw new AppError(
      "Payment not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  // التحقق من أن القسط لم يتم إغلاقه بالكامل
  if (calculations.isPaymentClosed(payment)) {
    throw new AppError(
      "Cannot update a closed payment (Paid or Partial). Create a new payment instead.",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // إذا تم إدخال مبلغ دفع
  if (data.amountPaid !== undefined) {
    const amountPaid = parseFloat(data.amountPaid);

    // التحقق من عدم تجاوز المبلغ
    if (amountPaid > payment.amountDue) {
      throw new AppError(
        `Amount paid cannot exceed the amount due (${payment.amountDue} EGP)`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // الحصول على معلومات الخطة الشهرية
    const installment = await prisma.installment.findUnique({
      where: { id: payment.installmentId },
    });

    // معالجة الدفع وإنشاء القسط التالي
    const { currentPaymentUpdate, nextPayment } =
      calculations.processPaymentAndCreateNext(
        payment,
        amountPaid,
        installment,
        data.notes
      );

    // تحديث القسط الحالي
    await installmentPaymentsRepository.updatePayment(
      prisma,
      id,
      currentPaymentUpdate
    );

    // إنشاء القسط التالي
    if (
      currentPaymentUpdate.status === "Paid" ||
      currentPaymentUpdate.status === "Partial"
    ) {
      // التحقق من عدم تجاوز عدد الأقساط
      const totalPayments =
        await installmentPaymentsRepository.findPaymentsByInstallmentId(
          prisma,
          payment.installmentId
        );

      if (totalPayments.length < installment.numberOfMonths) {
        await installmentPaymentsRepository.createPayment(prisma, nextPayment);
      }
    }

    // إرجاع القسط المحدث
    return await installmentPaymentsRepository.findPaymentById(prisma, id);
  }

  // تحديث الملاحظات فقط (إذا لم يتم تحديث المبلغ)
  const updateData = {};
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  if (Object.keys(updateData).length > 0) {
    return await installmentPaymentsRepository.updatePayment(
      prisma,
      id,
      updateData
    );
  }

  return payment;
}

/**
 * Delete installment payment (للمطورين فقط)
 */
export async function deletePayment(prisma, id, currentUser) {
  const { role } = currentUser;

  // Only developers can delete
  if (role !== "developer") {
    throw new AppError(
      "Only developers can delete installment payments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const payment = await installmentPaymentsRepository.findPaymentById(
    prisma,
    id
  );

  if (!payment) {
    throw new AppError("Payment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // منع حذف الأقساط المغلقة
  if (calculations.isPaymentClosed(payment)) {
    throw new AppError(
      "Cannot delete closed payment (Paid or Partial)",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  await installmentPaymentsRepository.deletePayment(prisma, id);
}

/**
 * Get installment summary (ملخص حالة الأقساط)
 */
export async function getInstallmentSummary(
  prisma,
  installmentId,
  currentUser
) {
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
  });

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  const payments =
    await installmentPaymentsRepository.findPaymentsByInstallmentId(
      prisma,
      installmentId
    );

  return calculations.getInstallmentSummary(payments, installment);
}

/**
 * ⭐ NEW: Get all payments for a specific installment
 */
export async function getPaymentsByInstallmentId(
  prisma,
  installmentId,
  currentUser
) {
  const { role, companyId } = currentUser;

  // First verify the installment exists and user has access to it
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: {
      invoice: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check company access for managers and employees
  if (role === "manager" || role === "employee") {
    if (installment.invoice.companyId !== companyId) {
      throw new AppError(
        "Access denied to this installment",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  // Get all payments for this installment
  return await installmentPaymentsRepository.findPaymentsByInstallmentIdWithDetails(
    prisma,
    installmentId
  );
}
