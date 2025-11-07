import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // ==========================================
    // 1. Create Companies
    // ==========================================
    console.log("📦 Creating companies...");

    const company1 = await prisma.company.create({
      data: {
        name: "شركة الندى للفلاتر",
        logo: "https://example.com/logos/alnada.png",
        address: "القاهرة، مدينة نصر، الحي الأول",
        email: "info@alnada.com",
        phone: "01012345678",
        subscriptionExpiryDate: new Date("2025-12-31"),
      },
    });

    const company2 = await prisma.company.create({
      data: {
        name: "شركة النيل للتكييفات",
        logo: "https://example.com/logos/nile.png",
        address: "الجيزة، المهندسين، شارع جامعة الدول",
        email: "contact@nile-ac.com",
        phone: "01098765432",
        subscriptionExpiryDate: new Date("2026-06-30"),
      },
    });

    console.log(`✅ Created ${2} companies`);

    // ==========================================
    // 2. Create Users
    // ==========================================
    console.log("👤 Creating users...");

    const hashedPassword = await bcrypt.hash("Password123", 10);

    await prisma.user.createMany({
      data: [
        {
          companyId: company1.id,
          fullName: "اكونت تجريبي موظف",
          email: "employee@alnada.com",
          passwordHash: hashedPassword,
          role: "employee",
          status: "Active",
        },
        {
          companyId: company1.id,
          fullName: "اكونت تجريبي مدير",
          email: "manager@alnada.com",
          passwordHash: hashedPassword,
          role: "manager",
          status: "Active",
        },
        {
          companyId: null,
          fullName: "اكونت تجريبي ديفيلوبر",
          email: "developer@dev.com",
          passwordHash: hashedPassword,
          role: "developer",
          status: "Active",
        },
      ],
    });

    console.log(`✅ Created ${3} users`);

    // ==========================================
    // 3. Create Suppliers
    // ==========================================
    console.log("🏭 Creating suppliers...");

    const supplier1 = await prisma.supplier.create({
      data: {
        name: "مورد الفلاتر المصرية",
        contactInfo: "البريد: supplier1@example.com | التليفون: 01555123456",
        companyId: company1.id,
      },
    });

    const supplier2 = await prisma.supplier.create({
      data: {
        name: "مورد التكييفات الحديثة",
        contactInfo: "البريد: supplier2@example.com | التليفون: 01666789012",
        companyId: company2.id,
      },
    });

    console.log(`✅ Created ${2} suppliers`);

// ==========================================
// 4. Create Products
// ==========================================
console.log("📦 Creating products...");

const product1 = await prisma.product.create({
  data: {
    name: "فلتر مياه 7 مراحل",
    category: "فلاتر المياه",
    price: 3500.0,
    stock: 50,
   supplier: { connect: { id: supplier1.id } },
    company: { connect: { id: company1.id } },
  },
});

const product2 = await prisma.product.create({
  data: {
    name: "فلتر مياه 5 مراحل",
    category: "فلاتر المياه",
    price: 2500.0,
    stock: 75,
    supplier: { connect: { id: supplier1.id } },
    company: { connect: { id: company1.id } },
  },
});

const product3 = await prisma.product.create({
  data: {
    name: "تكييف 1.5 حصان",
    category: "تكييفات",
    price: 8500.0,
    stock: 30,
    supplier: { connect: { id: supplier2.id } },
    company: { connect: { id: company2.id } },
  },
});

console.log(`✅ Created ${3} products`);

// ==========================================
// 5. Create Accessories
// ==========================================
console.log("🔧 Creating accessories...");

const accessory1 = await prisma.accessory.create({
  data: {
    name: "شمعة فلتر",
    category: "فلاتر المياه", 
    price: 150.0,
    stock: 200,
    supplier: { connect: { id: supplier1.id } },
    company: { connect: { id: company1.id } },
  },
});

const accessory2 = await prisma.accessory.create({
  data: {
    name: "ممبرين فلتر",
     category: "فلاتر المياه", // ✅ أضف دي
    price: 350.0,
    stock: 100,
    supplier: { connect: { id: supplier1.id } },
    company: { connect: { id: company1.id } },
  },
});

const accessory3 = await prisma.accessory.create({
  data: {
    name: "ريموت تكييف",
    category: "تكييفات", // ✅ أضف دي
    price: 250.0,
    stock: 50,
    supplier: { connect: { id: supplier2.id } },
    company: { connect: { id: company2.id } },
  },
});

console.log(`✅ Created ${3} accessories`);

// ==========================================
// 6. Create Product-Accessory Relations
// ==========================================
console.log("🔗 Creating product-accessory relations...");

await prisma.productAccessory.createMany({
  data: [
    { productId: product1.id, accessoryId: accessory1.id },
    { productId: product1.id, accessoryId: accessory2.id },
    { productId: product2.id, accessoryId: accessory1.id },
    { productId: product3.id, accessoryId: accessory3.id },
  ],
});

console.log(`✅ Created ${4} product-accessory relations`);

    // ==========================================
    // 7. Create Services
    // ==========================================
    console.log("🛠️ Creating services...");

    const service1 = await prisma.service.create({
      data: {
        name: "تركيب فلتر مياه",
        description: "خدمة تركيب فلتر المياه في المنزل مع الضمان",
        price: 300.0,
        companyId: company1.id,
      },
    });

    const service2 = await prisma.service.create({
      data: {
        name: "صيانة فلتر مياه",
        description: "خدمة صيانة دورية للفلتر تشمل تغيير الشمعات",
        price: 250.0,
        companyId: company1.id,
      },
    });

    const service3 = await prisma.service.create({
      data: {
        name: "تركيب تكييف",
        description: "خدمة تركيب التكييف مع التوصيلات الكهربائية",
        price: 500.0,
        companyId: company2.id,
      },
    });

    console.log(`✅ Created ${3} services`);

    // ==========================================
    // 8. Create Customers
    // ==========================================
    console.log("👥 Creating customers...");

    const customer1 = await prisma.customer.create({
      data: {
        fullName: "خالد عبد الرحمن",
        customerType: "Installation",
        nationalId: "29801011234567",
        idCardImage: "https://example.com/ids/customer1.jpg",
        primaryNumber: "01012345678",
        secondaryNumber: "01123456789",
        governorate: "القاهرة",
        city: "مدينة نصر",
        district: "الحي الأول",
        companyId: company1.id,
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        fullName: "سارة محمود",
        customerType: "Maintenance",
        nationalId: "29505051234568",
        primaryNumber: "01098765432",
        governorate: "الجيزة",
        city: "المهندسين",
        district: "شارع جامعة الدول",
        companyId: company1.id,
      },
    });

    const customer3 = await prisma.customer.create({
      data: {
        fullName: "عمر حسن",
        customerType: "Installation",
        nationalId: "28703031234569",
        primaryNumber: "01187654321",
        governorate: "الإسكندرية",
        city: "سموحة",
        district: "شارع فوزي معاذ",
        companyId: company2.id,
      },
    });

    console.log(`✅ Created ${3} customers`);

    // ==========================================
    // 9. Create Employees
    // ==========================================
    console.log("👷 Creating employees...");

    const employee1 = await prisma.employee.create({
      data: {
        fullName: "محمد أحمد السيد",
        nationalId: "29001011234570",
        role: "SalesRep",
        primaryNumber: "01012340000",
        city: "القاهرة",
        district: "النزهة",
        governorate: "القاهرة",
        companyId: company1.id,
        isEmployed: true,
      },
    });

    const employee2 = await prisma.employee.create({
      data: {
        fullName: "علي حسين",
        nationalId: "28805051234571",
        idCardImage: "https://example.com/ids/employee2.jpg",
        role: "Technician",
        primaryNumber: "01098760000",
        secondaryNumber: "01123460000",
        city: "الجيزة",
        district: "الدقي",
        governorate: "الجيزة",
        companyId: company1.id,
        isEmployed: true,
      },
    });

    const employee3 = await prisma.employee.create({
      data: {
        fullName: "يوسف عبد الله",
        nationalId: "29203031234572",
        role: "SalesRep",
        primaryNumber: "01187650000",
        city: "الجيزة",
        district: "المهندسين",
        governorate: "الجيزة",
        companyId: company2.id,
        isEmployed: true,
      },
    });

    const employee4 = await prisma.employee.create({
      data: {
        fullName: "حسام محمد",
        nationalId: "28607071234573",
        role: "Technician",
        primaryNumber: "01054320000",
        city: "الإسكندرية",
        district: "سموحة",
        governorate: "الإسكندرية",
        companyId: company2.id,
        isEmployed: true,
      },
    });

    console.log(`✅ Created ${4} employees`);

    // ==========================================
    // 10. Create Invoices (Cash Sale)
    // ==========================================
    console.log("🧾 Creating invoices...");

    const invoice1 = await prisma.invoice.create({
      data: {
        customerId: customer1.id,
        salesRepId: employee1.id,
        technicianId: employee2.id,
        companyId: company1.id,
        totalAmount: 4050.0,
        discountAmount: 0,
        saleType: "Cash",
        maintenancePeriod: 12,
        paidAtContract: 4050.0,
        paidAtInstallation: 0,
        installationCostType: "Percentage",
        installationCostValue: 10,
        contractDate: new Date("2024-10-15"),
        installationDate: new Date("2024-10-20"),
        contractNotes: "عميل ممتاز - دفع كامل المبلغ نقداً",
      },
    });

    // ==========================================
    // 11. Create Invoice Items
    // ==========================================
    console.log("📝 Creating invoice items...");

    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice1.id,
          productId: product1.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 3500.0,
          subtotal: 3500.0,
        },
        {
          invoiceId: invoice1.id,
          serviceId: service1.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 300.0,
          subtotal: 300.0,
        },
        {
          invoiceId: invoice1.id,
          accessoryId: accessory1.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 150.0,
          subtotal: 150.0,
        },
        {
          invoiceId: invoice1.id,
          accessoryId: accessory2.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 350.0,
          subtotal: 350.0,
        },
      ],
    });

    console.log(`✅ Created invoice items for invoice #${invoice1.id}`);

    // ==========================================
    // 12. Create Invoice with Installment
    // ==========================================
    console.log("💳 Creating installment invoice...");

    const invoice2 = await prisma.invoice.create({
      data: {
        customerId: customer2.id,
        salesRepId: employee1.id,
        technicianId: employee2.id,
        companyId: company1.id,
        totalAmount: 2800.0,
        discountAmount: 200.0,
        saleType: "Installment",
        maintenancePeriod: 24,
        paidAtContract: 500.0,
        paidAtInstallation: 300.0,
        installationCostType: "Fixed",
        installationCostValue: 250.0,
        contractDate: new Date("2024-11-01"),
        installationDate: new Date("2024-11-05"),
        contractNotes: "تقسيط على 6 أشهر - مقدم 800 جنيه",
      },
    });

    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice2.id,
          productId: product2.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 2500.0,
          subtotal: 2500.0,
        },
        {
          invoiceId: invoice2.id,
          serviceId: service1.id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 300.0,
          subtotal: 300.0,
        },
      ],
    });

    // ==========================================
    // 13. Create Installment Plan
    // ==========================================
    console.log("📅 Creating installment plan...");

    const remainingAmount = 2800.0 - 500.0 - 300.0; // 2000.00
    const numberOfMonths = 6;
    const monthlyInstallment = remainingAmount / numberOfMonths;

    const installment = await prisma.installment.create({
      data: {
        invoiceId: invoice2.id,
        numberOfMonths: numberOfMonths,
        monthlyInstallment: monthlyInstallment,
        collectionStartDate: new Date("2024-12-01"),
        collectionEndDate: new Date("2025-05-01"),
      },
    });

    console.log(`✅ Created installment plan with ${numberOfMonths} months`);

    // ==========================================
    // 14. Create Installment Payments
    // ==========================================
    console.log("💰 Creating installment payments...");

    const installmentPayments = [];
    for (let i = 0; i < numberOfMonths; i++) {
      const dueDate = new Date("2024-12-01");
      dueDate.setMonth(dueDate.getMonth() + i);

      installmentPayments.push({
        installmentId: installment.id,
        customerId: customer2.id,
        amountDue: monthlyInstallment,
        amountPaid: i === 0 ? monthlyInstallment : 0, // First payment paid
        carryoverAmount: 0,
        overdueAmount: 0,
        status: i === 0 ? "Paid" : "Pending",
        dueDate: dueDate,
        paymentDate: i === 0 ? new Date("2024-12-01") : null,
        notes: i === 0 ? "تم الدفع في الموعد" : null,
      });
    }

    await prisma.installmentPayment.createMany({
      data: installmentPayments,
    });

    console.log(`✅ Created ${numberOfMonths} installment payments`);

    // ==========================================
    // 15. Create Maintenance Records
    // ==========================================
    console.log("🔧 Creating maintenance records...");

    await prisma.maintenance.createMany({
      data: [
        {
          customerId: customer1.id,
          serviceId: service2.id,
          productId: product1.id,
          technicianId: employee2.id,
          companyId: company1.id,
          maintenanceDate: new Date("2024-11-10"),
          price: 250.0,
          status: "Completed",
          notes: "تم تغيير الشمعات - الفلتر يعمل بكفاءة عالية",
        },
        {
          customerId: customer2.id,
          serviceId: service2.id,
          productId: product2.id,
          technicianId: employee2.id,
          companyId: company1.id,
          maintenanceDate: new Date("2024-12-01"),
          price: 250.0,
          status: "Pending",
          notes: "موعد الصيانة الدورية القادم",
        },
        {
          customerId: customer3.id,
          serviceId: service3.id,
          productId: product3.id,
          technicianId: employee4.id,
          companyId: company2.id,
          maintenanceDate: new Date("2024-10-25"),
          price: 500.0,
          status: "Completed",
          notes: "تم تركيب التكييف بنجاح - تم اختباره",
        },
      ],
    });

    console.log(`✅ Created ${3} maintenance records`);

    // ==========================================
    // Summary
    // ==========================================
    console.log("\n✨ Seeding completed successfully!");
    console.log("═══════════════════════════════════════");
    console.log("📊 Summary:");
    console.log(`   - Companies: 2`);
    console.log(`   - Users: 3`);
    console.log(`   - Suppliers: 2`);
    console.log(`   - Products: 3`);
    console.log(`   - Accessories: 3`);
    console.log(`   - Services: 3`);
    console.log(`   - Customers: 3`);
    console.log(`   - Employees: 4`);
    console.log(`   - Invoices: 2 (1 Cash, 1 Installment)`);
    console.log(`   - Installment Payments: 6`);
    console.log(`   - Maintenance Records: 3`);
    console.log("═══════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Fatal error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
