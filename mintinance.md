# 📋 مستند متطلبات تعديل نظام الصيانة الدورية

## 🎯 الهدف من التعديل

تحويل حقل `maintenancePeriod` من "فترة صيانة مجانية بالأشهر" إلى "دورية الصيانة" بحيث يتم جدولة صيانات دورية تلقائية للعميل بناءً على:
1. **دورية الصيانة** (كل كام شهر)
2. **تاريخ التركيب** (نقطة البداية)
3. **تاريخ نهاية الصيانة** (نقطة النهاية)

---

## 📊 الوضع الحالي (Current State)

### الحقول الموجودة في جدول `Invoice`:

```prisma
maintenancePeriod     Int?      // حالياً: عدد الأشهر المجانية (مثال: 12 شهر)
installationDate      DateTime? // تاريخ التركيب
```

### المشكلة:
- `maintenancePeriod` حالياً يُستخدم كـ **"مدة الضمان"** وليس **"دورية الصيانة"**
- لا يوجد آلية لجدولة صيانات دورية تلقائية
- لا يوجد تاريخ نهاية واضح للصيانة

---

## 🔄 الوضع المطلوب (Target State)

### 1️⃣ تعديل معنى `maintenancePeriod`

**المعنى الجديد:** دورية الصيانة (Maintenance Frequency)

| القيمة | المعنى |
|--------|--------|
| `1` | صيانة كل شهر |
| `2` | صيانة كل شهرين |
| `3` | صيانة كل 3 أشهر |
| `6` | صيانة كل 6 أشهر |
| `12` | صيانة كل سنة |

### 2️⃣ إضافة حقل جديد لتاريخ نهاية الصيانة

```prisma
model Invoice {
  // ... باقي الحقول
  
  maintenancePeriod    Int?      @map("maintenance_period")      // دورية الصيانة (كل كام شهر)
  installationDate     DateTime? @map("installation_date")       // تاريخ التركيب
  maintenanceEndDate   DateTime? @map("maintenance_end_date")    // 🆕 تاريخ نهاية الصيانة
}
```

---

## 🎬 سيناريو عملي كامل

### المدخلات في الفاتورة:

```javascript
{
  customerId: 1,              // العميل: أحمد
  installationDate: "2026-01-01",    // تاريخ التركيب: 1 يناير 2026
  maintenancePeriod: 2,              // صيانة كل شهرين
  maintenanceEndDate: "2026-12-01",  // نهاية الصيانة: 1 ديسمبر 2026
  // ... باقي بيانات الفاتورة
}
```

### الصيانات المتوقع جدولتها تلقائياً:

| # | تاريخ الصيانة | الحسبة | ملاحظات |
|---|---------------|--------|---------|
| 1 | 1 مارس 2026 | 1 يناير + شهرين | أول صيانة |
| 2 | 1 مايو 2026 | 1 مارس + شهرين | |
| 3 | 1 يوليو 2026 | 1 مايو + شهرين | |
| 4 | 1 سبتمبر 2026 | 1 يوليو + شهرين | |
| 5 | 1 نوفمبر 2026 | 1 سبتمبر + شهرين | آخر صيانة |

**ملاحظة:** الصيانة في 1 يناير 2027 لن تُنشأ لأن تاريخ نهاية الصيانة هو 1 ديسمبر 2026

---

## 🏗️ التعديلات المطلوبة على قاعدة البيانات

### الخطوة 1: إضافة حقل جديد في Schema

```prisma
model Invoice {
  id                    Int       @id @default(autoincrement()) @map("invoice_id")
  customerId            Int       @map("customer_id")
  salesRepId            Int       @map("sales_rep_id")
  technicianId          Int?      @map("technician_id")
  companyId             Int       @map("company_id")
  totalAmount           Decimal   @default(0) @map("total_amount") @db.Decimal(10, 2)
  discountAmount        Decimal   @default(0) @map("discount_amount") @db.Decimal(10, 2)
  saleType              String    @map("sale_type") @db.VarChar(20)
  
  // 🔄 تعديل: دورية الصيانة بالأشهر (كل كام شهر تحصل صيانة)
  maintenancePeriod     Int?      @map("maintenance_period")
  
  // 🆕 جديد: تاريخ نهاية الصيانة
  maintenanceEndDate    DateTime? @map("maintenance_end_date") @db.Timestamp(6)
  
  paidAtContract        Decimal   @default(0) @map("paid_at_contract") @db.Decimal(10, 2)
  paidAtInstallation    Decimal   @default(0) @map("paid_at_installation") @db.Decimal(10, 2)
  installationCostType  String    @default("Percentage") @map("installation_cost_type") @db.VarChar(20)
  installationCostValue Decimal   @default(0) @map("installation_cost_value") @db.Decimal(10, 2)
  contractDate          DateTime  @map("contract_date") @db.Timestamp(6)
  installationDate      DateTime? @map("installation_date") @db.Timestamp(6)
  contractNotes         String?   @map("contract_notes") @db.Text
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamp(6)

  // Relations
  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  customer     Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  salesRep     Employee      @relation("SalesRepInvoices", fields: [salesRepId], references: [id], onDelete: Restrict)
  technician   Employee?     @relation("TechnicianInvoices", fields: [technicianId], references: [id], onDelete: Restrict)
  invoiceItems InvoiceItem[]
  installment  Installment?

  @@index([companyId])
  @@index([customerId])
  @@index([salesRepId])
  @@index([technicianId])
  @@index([saleType])
  @@index([contractDate])
  @@index([maintenanceEndDate]) // 🆕 فهرس جديد للبحث السريع
  @@map("invoices")
}
```

### الخطوة 2: إنشاء Migration

```bash
npx prisma migrate dev --name add_maintenance_end_date
```

---

## 💻 المنطق البرمجي المطلوب

### 1️⃣ دالة إنشاء جدول الصيانات التلقائي

عند إنشاء فاتورة جديدة أو تحديث تاريخ التركيب، يتم استدعاء هذه الدالة:

```javascript
/**
 * إنشاء سجلات صيانة دورية تلقائياً
 * @param {Object} invoiceData - بيانات الفاتورة
 */
async function generateScheduledMaintenances(invoiceData) {
  const {
    invoiceId,
    customerId,
    companyId,
    installationDate,
    maintenancePeriod,
    maintenanceEndDate,
    productIds, // المنتجات المشتراة في الفاتورة
    technicianId, // الفني المسؤول (اختياري)
    serviceId // خدمة الصيانة الافتراضية
  } = invoiceData;

  // ✅ التحقق من وجود البيانات المطلوبة
  if (!installationDate || !maintenancePeriod || !maintenanceEndDate) {
    console.log('لا يوجد جدول صيانة - البيانات غير مكتملة');
    return;
  }

  const scheduledMaintenances = [];
  let currentMaintenanceDate = new Date(installationDate);

  // 🔁 حساب تواريخ الصيانة الدورية
  while (true) {
    // إضافة الدورية (عدد الأشهر)
    currentMaintenanceDate.setMonth(
      currentMaintenanceDate.getMonth() + maintenancePeriod
    );

    // ✋ إيقاف إذا تجاوزنا تاريخ النهاية
    if (currentMaintenanceDate > new Date(maintenanceEndDate)) {
      break;
    }

    // 📝 إنشاء سجل صيانة لكل منتج
    for (const productId of productIds) {
      scheduledMaintenances.push({
        customerId,
        companyId,
        productId,
        serviceId,
        technicianId: technicianId || null,
        maintenanceDate: new Date(currentMaintenanceDate),
        status: 'Pending', // حالة الصيانة: معلقة
        price: 0, // صيانة مجانية ضمن الضمان
        notes: `صيانة دورية مجدولة تلقائياً - كل ${maintenancePeriod} شهر`
      });
    }
  }

  // 💾 حفظ جميع سجلات الصيانة في قاعدة البيانات
  if (scheduledMaintenances.length > 0) {
    await prisma.maintenance.createMany({
      data: scheduledMaintenances
    });
    
    console.log(`✅ تم جدولة ${scheduledMaintenances.length} صيانة دورية`);
  }

  return scheduledMaintenances;
}
```

### 2️⃣ استدعاء الدالة عند إنشاء/تعديل الفاتورة

```javascript
// في API endpoint إنشاء الفاتورة
app.post('/api/invoices', async (req, res) => {
  try {
    // 1️⃣ إنشاء الفاتورة
    const invoice = await prisma.invoice.create({
      data: {
        customerId: req.body.customerId,
        salesRepId: req.body.salesRepId,
        technicianId: req.body.technicianId,
        companyId: req.user.companyId,
        totalAmount: req.body.totalAmount,
        saleType: req.body.saleType,
        installationDate: req.body.installationDate,
        maintenancePeriod: req.body.maintenancePeriod,
        maintenanceEndDate: req.body.maintenanceEndDate,
        // ... باقي البيانات
      }
    });

    // 2️⃣ إنشاء عناصر الفاتورة (المنتجات)
    const invoiceItems = await prisma.invoiceItem.createMany({
      data: req.body.items.map(item => ({
        invoiceId: invoice.id,
        productId: item.productId,
        companyId: req.user.companyId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      }))
    });

    // 3️⃣ استخراج IDs المنتجات
    const productIds = req.body.items
      .filter(item => item.productId)
      .map(item => item.productId);

    // 4️⃣ 🆕 جدولة الصيانات الدورية تلقائياً
    if (req.body.maintenancePeriod && req.body.installationDate) {
      await generateScheduledMaintenances({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        companyId: req.user.companyId,
        installationDate: invoice.installationDate,
        maintenancePeriod: invoice.maintenancePeriod,
        maintenanceEndDate: invoice.maintenanceEndDate,
        productIds: productIds,
        technicianId: invoice.technicianId,
        serviceId: req.body.maintenanceServiceId // ID خدمة الصيانة الدورية
      });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📅 Cron Job للتحديث اليومي (اختياري)

في حالة الحاجة لتحديث حالات الصيانة (مثلاً تحويل `Pending` إلى `Overdue`):

```javascript
import cron from 'node-cron';

// يعمل كل يوم الساعة 1 صباحاً
cron.schedule('0 1 * * *', async () => {
  console.log('🔄 جاري تحديث حالات الصيانة...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // تحديث الصيانات المتأخرة
  await prisma.maintenance.updateMany({
    where: {
      maintenanceDate: {
        lt: today // تاريخ الصيانة أقل من اليوم
      },
      status: 'Pending'
    },
    data: {
      status: 'Overdue' // تحويل إلى متأخرة
    }
  });

  console.log('✅ تم تحديث حالات الصيانة');
});
```

---

## 🎨 واجهة المستخدم (UI Changes)

### نموذج إنشاء الفاتورة - الحقول المطلوبة:

```jsx
<Form>
  {/* ... باقي حقول الفاتورة */}
  
  <FormGroup>
    <Label>تاريخ التركيب *</Label>
    <Input 
      type="date" 
      name="installationDate"
      required
    />
  </FormGroup>

  <FormGroup>
    <Label>دورية الصيانة (كل كام شهر؟)</Label>
    <Select name="maintenancePeriod">
      <option value="">لا يوجد صيانة دورية</option>
      <option value="1">كل شهر</option>
      <option value="2">كل شهرين</option>
      <option value="3">كل 3 أشهر</option>
      <option value="6">كل 6 أشهر</option>
      <option value="12">كل سنة</option>
    </Select>
  </FormGroup>

  <FormGroup>
    <Label>تاريخ نهاية الصيانة</Label>
    <Input 
      type="date" 
      name="maintenanceEndDate"
      min={installationDate} // لا يمكن أن يكون قبل تاريخ التركيب
    />
    <small className="text-muted">
      الصيانات الدورية ستتوقف بعد هذا التاريخ
    </small>
  </FormGroup>
</Form>
```

---

## 📊 عرض الصيانات المجدولة

### API لجلب صيانات العميل:

```javascript
// GET /api/customers/:id/maintenances
app.get('/api/customers/:id/maintenances', async (req, res) => {
  const maintenances = await prisma.maintenance.findMany({
    where: {
      customerId: parseInt(req.params.id),
      companyId: req.user.companyId
    },
    include: {
      product: true,
      service: true,
      technician: true
    },
    orderBy: {
      maintenanceDate: 'asc'
    }
  });

  res.json(maintenances);
});
```

### عرض في واجهة المستخدم:

```jsx
<Table>
  <thead>
    <tr>
      <th>التاريخ</th>
      <th>المنتج</th>
      <th>الخدمة</th>
      <th>الفني</th>
      <th>الحالة</th>
      <th>السعر</th>
    </tr>
  </thead>
  <tbody>
    {maintenances.map(m => (
      <tr key={m.id}>
        <td>{formatDate(m.maintenanceDate)}</td>
        <td>{m.product.name}</td>
        <td>{m.service.name}</td>
        <td>{m.technician?.fullName || 'غير محدد'}</td>
        <td>
          <Badge color={getStatusColor(m.status)}>
            {m.status}
          </Badge>
        </td>
        <td>{m.price} جنيه</td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## ⚠️ الحالات الخاصة والاستثناءات

### 1. ماذا لو لم يتم تحديد `maintenanceEndDate`؟
```javascript
// افتراض: الصيانة لمدة سنة من تاريخ التركيب
if (!maintenanceEndDate && installationDate) {
  const endDate = new Date(installationDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  maintenanceEndDate = endDate;
}
```

### 2. ماذا لو تم تغيير تاريخ التركيب بعد إنشاء الفاتورة؟
```javascript
// حذف الصيانات القديمة وإعادة الجدولة
async function rescheduleMaintenances(invoiceId) {
  // 1. حذف الصيانات المعلقة القديمة
  await prisma.maintenance.deleteMany({
    where: {
      invoiceId: invoiceId, // يتطلب إضافة invoiceId في schema
      status: 'Pending'
    }
  });

  // 2. إعادة الجدولة
  await generateScheduledMaintenances(updatedInvoiceData);
}
```

### 3. ماذا لو كان هناك عدة منتجات في الفاتورة؟
- يتم إنشاء سجل صيانة منفصل لكل منتج
- كل منتج له جدول صيانة خاص به

---

## 🧪 اختبار السيناريو

### Test Case 1: الحالة العادية

```javascript
const testInvoice = {
  customerId: 1,
  installationDate: '2026-01-01',
  maintenancePeriod: 2,
  maintenanceEndDate: '2026-12-01',
  productIds: [1, 2]
};

// النتيجة المتوقعة:
// - 5 صيانات لكل منتج (إجمالي 10 سجلات)
// - التواريخ: 1/3, 1/5, 1/7, 1/9, 1/11
```


---

## 📝 تحديث Seed Data

```javascript
// في ملف seed.js
const invoice1 = await prisma.invoice.create({
  data: {
    customerId: customer1.id,
    salesRepId: employee1.id,
    technicianId: employee2.id,
    companyId: company1.id,
    totalAmount: 4050.0,
    saleType: "Cash",
    installationDate: new Date("2026-01-01"),
    maintenancePeriod: 2, // 🔄 صيانة كل شهرين
    maintenanceEndDate: new Date("2026-12-01"), // 🆕 نهاية الصيانة
    contractDate: new Date("2025-12-15"),
    // ... باقي البيانات
  },
});

// 🆕 جدولة الصيانات تلقائياً
await generateScheduledMaintenances({
  invoiceId: invoice1.id,
  customerId: customer1.id,
  companyId: company1.id,
  installationDate: invoice1.installationDate,
  maintenancePeriod: invoice1.maintenancePeriod,
  maintenanceEndDate: invoice1.maintenanceEndDate,
  productIds: [product1.id],
  technicianId: employee2.id,
  serviceId: service2.id
});
```

---

## ✅ Checklist التنفيذ

### Backend:
- [ ] تعديل `schema.prisma` (إضافة `maintenanceEndDate`)
- [ ] تشغيل `prisma migrate dev`
- [ ] كتابة دالة `generateScheduledMaintenances()`
- [ ] تعديل API إنشاء الفاتورة
- [ ] تعديل API تحديث الفاتورة
- [ ] إضافة Cron Job (اختياري)
- [ ] كتابة Unit Tests

### Frontend:
- [ ] تعديل نموذج إنشاء الفاتورة
- [ ] إضافة حقل تاريخ نهاية الصيانة
- [ ] تعديل عرض الصيانات المجدولة
- [ ] إضافة تحذيرات للصيانات المتأخرة

### Database:
- [ ] تحديث Seed Data
- [ ] ترحيل البيانات القديمة (إذا لزم)

---

## 📞 نقاط للمناقشة مع الفريق

1. **هل نحتاج لربط الصيانة بالفاتورة مباشرة؟**
   - إضافة `invoiceId` في جدول `Maintenance`

2. **من يختار الفني للصيانات المجدولة؟**
   - يدوي

---

**✨ انتهى المستند - جاهز للتنفيذ!**