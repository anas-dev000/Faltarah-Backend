import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // ==========================================
    // 1. Clear existing data
    // ==========================================
    console.log("🧹 Clearing existing data...");
    await prisma.subscriptionAlert.deleteMany({});
    await prisma.subscriptionInvoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.installmentPayment.deleteMany({});
    await prisma.installment.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.maintenance.deleteMany({});
    await prisma.customerMaintenanceStatus.deleteMany({});
    await prisma.productAccessory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.accessory.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.pendingUser.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.company.deleteMany({});
    console.log("✅ Cleared all data\n");

    // ==========================================
    // 2. Create Subscription Plans
    // ==========================================
    console.log("📋 Creating subscription plans...");
    const plans = await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: "Trial",
          nameAr: "تجريبي",
          description: "10-day free trial to test the system",
          descriptionAr: "فترة تجريبية مجانية لمدة 10 أيام لتجربة النظام",
          price: 0.0,
          durationDays: 10,
          features: [
            { en: "All features included", ar: "جميع المميزات متاحة" },
            { en: "Up to 50 invoices", ar: "حتى 50 فاتورة" },
            { en: "Basic support", ar: "دعم أساسي" },
          ],
          isActive: true,
          displayOrder: 1,
        },
        {
          name: "Monthly",
          nameAr: "شهري",
          description: "Perfect for small businesses",
          descriptionAr: "مثالي للشركات الصغيرة",
          price: 299.0,
          durationDays: 30,
          features: [
            { en: "Unlimited invoices", ar: "فواتير غير محدودة" },
            { en: "Unlimited customers", ar: "عملاء غير محدودين" },
            { en: "Email support", ar: "دعم عبر البريد" },
            { en: "Monthly reports", ar: "تقارير شهرية" },
          ],
          isActive: true,
          displayOrder: 2,
        },
        {
          name: "Quarterly",
          nameAr: "ربع سنوي",
          description: "Save 15% with quarterly billing",
          descriptionAr: "وفر 15% مع الدفع الربع سنوي",
          price: 765.75,
          durationDays: 90,
          features: [
            { en: "All Monthly features", ar: "جميع مميزات الباقة الشهرية" },
            { en: "Save 15%", ar: "وفر 15%" },
            { en: "Priority support", ar: "دعم ذو أولوية" },
            { en: "Quarterly reports", ar: "تقارير ربع سنوية" },
          ],
          isActive: true,
          displayOrder: 3,
        },
        {
          name: "Yearly",
          nameAr: "سنوي",
          description: "Best value - Save 25%",
          descriptionAr: "أفضل قيمة - وفر 25%",
          price: 2691.0,
          durationDays: 365,
          features: [
            {
              en: "All Quarterly features",
              ar: "جميع مميزات الباقة الربع سنوية",
            },
            { en: "Save 25%", ar: "وفر 25%" },
            { en: "24/7 Premium support", ar: "دعم مميز على مدار الساعة" },
            { en: "Annual consultation", ar: "استشارة استراتيجية سنوية" },
            { en: "Custom reports", ar: "تقارير مخصصة" },
          ],
          isActive: true,
          displayOrder: 4,
        },
      ],
    });
    console.log(`✅ Created ${plans.count} subscription plans\n`);

    // ==========================================
    // 3. Create Companies
    // ==========================================
    console.log("🏢 Creating companies...");
    const company1 = await prisma.company.create({
      data: {
        name: "شركة الندى للفلاتر",
        logo: "https://example.com/logos/alnada.png",
        address: "القاهرة، مدينة نصر، الحي الأول، شارع النيل",
        email: "info@alnada.com",
        phone: "01012345678",
        subscriptionExpiryDate: new Date("2026-12-31"),
      },
    });

    const company2 = await prisma.company.create({
      data: {
        name: "شركة النيل للتكييفات",
        logo: "https://example.com/logos/nile.png",
        address: "الجيزة، المهندسين، شارع جامعة الدول، برج النيل",
        email: "contact@nile-ac.com",
        phone: "01098765432",
        subscriptionExpiryDate: new Date("2027-06-30"),
      },
    });

    const company3 = await prisma.company.create({
      data: {
        name: "شركة الصفوة للصيانة",
        logo: "https://example.com/logos/safwa.png",
        address: "الإسكندرية، سموحة، شارع فوزي معاذ",
        email: "support@safwa.com",
        phone: "01123456789",
        subscriptionExpiryDate: new Date("2026-03-15"),
      },
    });

    const company4 = await prisma.company.create({
      data: {
        name: "شركة النور للأجهزة الكهربائية",
        logo: "https://example.com/logos/alnoor.png",
        address: "القاهرة، عابدين، شارع محمد فريد",
        email: "info@alnoor.com",
        phone: "01234567890",
        subscriptionExpiryDate: new Date("2024-06-30"), // تاريخ منتهي الصلاحية
      },
    });

    console.log(`✅ Created 4 companies\n`);

    // ==========================================
    // 4. Create Users
    // ==========================================
    console.log("👤 Creating users...");
    const hashedPassword = await bcrypt.hash("Password123", 10);
    const hashedPassword2 = await bcrypt.hash("SecurePass456", 10);
    const hashedPassword3 = await bcrypt.hash("AdminPass789", 10);

    await prisma.user.createMany({
      data: [
        {
          companyId: company1.id,
          fullName: "أحمد محمود السيد",
          email: "employee@alnada.com",
          passwordHash: hashedPassword,
          role: "employee",
          status: "Active",
        },
        {
          companyId: company1.id,
          fullName: "فاطمة علي محمد",
          email: "manager@alnada.com",
          passwordHash: hashedPassword,
          role: "manager",
          status: "Active",
        },
        {
          companyId: company2.id,
          fullName: "محمد حسن إبراهيم",
          email: "employee@nile-ac.com",
          passwordHash: hashedPassword2,
          role: "employee",
          status: "Active",
        },
        {
          companyId: company2.id,
          fullName: "ليلى محمود عبد الله",
          email: "manager@nile-ac.com",
          passwordHash: hashedPassword2,
          role: "manager",
          status: "Active",
        },
        {
          companyId: company3.id,
          fullName: "سعيد عبد الحميد",
          email: "admin@safwa.com",
          passwordHash: hashedPassword3,
          role: "manager",
          status: "Active",
        },
        {
          companyId: company4.id,
          fullName: "ياسين محمد سالم",
          email: "manager@alnoor.com",
          passwordHash: hashedPassword3,
          role: "manager",
          status: "Active",
        },
        {
          companyId: company4.id,
          fullName: "نعمة جميل أحمد",
          email: "employee@alnoor.com",
          passwordHash: hashedPassword3,
          role: "employee",
          status: "Inactive", // موظف غير نشط لشركة منتهية
        },
        {
          companyId: null,
          fullName: "مسؤول النظام",
          email: "developer@system.com",
          passwordHash: hashedPassword3,
          role: "developer",
          status: "Active",
        },
      ],
    });
    console.log(`✅ Created 6 users\n`);

    // ==========================================
    // 5. Create Pending Users
    // ==========================================
    console.log("⏳ Creating pending users...");
    const hashedPendingPass = await bcrypt.hash("TempPass123", 10);

    await prisma.pendingUser.createMany({
      data: [
        {
          email: "newuser1@example.com",
          fullName: "خالد عبد الرحمن",
          passwordHash: hashedPendingPass,
          companyName: "شركة جديدة للتسويق",
          companyPhone: "01500000000",
          companyAddress: "القاهرة، النزهة",
          companyEmail: "company1@example.com",
          otp: "123456",
          otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
          isVerified: false,
        },
        {
          email: "newuser2@example.com",
          fullName: "سارة محمود أحمد",
          passwordHash: hashedPendingPass,
          companyName: "شركة التكنولوجيا الحديثة",
          companyPhone: "01600000000",
          companyAddress: "الجيزة، المهندسين",
          companyEmail: "company2@example.com",
          otp: "654321",
          otpExpiry: new Date(Date.now() + 20 * 60 * 1000),
          isVerified: true,
          verifiedAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      ],
    });
    console.log(`✅ Created 2 pending users\n`);

    // ==========================================
    // 6. Create Password Reset Tokens
    // ==========================================
    console.log("🔐 Creating password reset tokens...");
    const users = await prisma.user.findMany({ take: 2 });

    await prisma.passwordReset.createMany({
      data: [
        {
          userId: users[0].id,
          token: "reset_token_" + Date.now() + "_1",
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isUsed: false,
        },
        {
          userId: users[1].id,
          token: "reset_token_" + Date.now() + "_2",
          expiry: new Date(Date.now() + 12 * 60 * 60 * 1000),
          isUsed: true,
          usedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    });
    console.log(`✅ Created 2 password reset tokens\n`);

    // ==========================================
    // 7. Create Suppliers
    // ==========================================
    console.log("🏭 Creating suppliers...");
    const supplier1 = await prisma.supplier.create({
      data: {
        name: "مورد الفلاتر المصرية",
        contactInfo:
          "البريد: supplier1@example.com | التليفون: 01555123456 | الموقع: القاهرة",
        companyId: company1.id,
      },
    });

    const supplier2 = await prisma.supplier.create({
      data: {
        name: "مورد التكييفات الحديثة",
        contactInfo:
          "البريد: supplier2@example.com | التليفون: 01666789012 | الموقع: الجيزة",
        companyId: company2.id,
      },
    });

    const supplier3 = await prisma.supplier.create({
      data: {
        name: "مورد الأجزاء والملحقات",
        contactInfo:
          "البريد: supplier3@example.com | التليفون: 01777654321 | الموقع: الإسكندرية",
        companyId: company3.id,
      },
    });

    console.log(`✅ Created 3 suppliers\n`);

    // ==========================================
    // 8. Create Products
    // ==========================================
    console.log("📦 Creating products...");
    const products = [];

    // Company 1 Products
    products.push(
      await prisma.product.create({
        data: {
          name: "فلتر مياه 7 مراحل بنظام العكس الأسموزي",
          category: "فلاتر المياه",
          price: 3500.0,
          stock: 50,
          supplierId: supplier1.id,
          companyId: company1.id,
        },
      })
    );

    products.push(
      await prisma.product.create({
        data: {
          name: "فلتر مياه 5 مراحل",
          category: "فلاتر المياه",
          price: 2500.0,
          stock: 75,
          supplierId: supplier1.id,
          companyId: company1.id,
        },
      })
    );

    products.push(
      await prisma.product.create({
        data: {
          name: "فلتر مياه 3 مراحل اقتصادي",
          category: "فلاتر المياه",
          price: 1500.0,
          stock: 100,
          supplierId: supplier1.id,
          companyId: company1.id,
        },
      })
    );

    // Company 2 Products
    products.push(
      await prisma.product.create({
        data: {
          name: "تكييف 1.5 حصان بارد وساخن",
          category: "تكييفات",
          price: 8500.0,
          stock: 30,
          supplierId: supplier2.id,
          companyId: company2.id,
        },
      })
    );

    products.push(
      await prisma.product.create({
        data: {
          name: "تكييف 2 حصان بارد وساخن",
          category: "تكييفات",
          price: 10500.0,
          stock: 20,
          supplierId: supplier2.id,
          companyId: company2.id,
        },
      })
    );

    products.push(
      await prisma.product.create({
        data: {
          name: "تكييف 1 حصان بارد فقط",
          category: "تكييفات",
          price: 6500.0,
          stock: 40,
          supplierId: supplier2.id,
          companyId: company2.id,
        },
      })
    );

    // Company 3 Products
    products.push(
      await prisma.product.create({
        data: {
          name: "مضخة ماء صيانة 3 حصان",
          category: "مضخات",
          price: 4500.0,
          stock: 25,
          supplierId: supplier3.id,
          companyId: company3.id,
        },
      })
    );

    console.log(`✅ Created ${products.length} products\n`);

    // ==========================================
    // 9. Create Accessories
    // ==========================================
    console.log("🔧 Creating accessories...");
    const accessories = [];

    accessories.push(
      await prisma.accessory.create({
        data: {
          name: "شمعة فلتر مياه",
          price: 150.0,
          stock: 200,
          supplierId: supplier1.id,
          companyId: company1.id,
        },
      })
    );

    accessories.push(
      await prisma.accessory.create({
        data: {
          name: "ممبرين فلتر عكس أسموزي",
          price: 350.0,
          stock: 100,
          supplierId: supplier1.id,
          companyId: company1.id,
        },
      })
    );

    accessories.push(
      await prisma.accessory.create({
        data: {
          name: "ريموت كنترول تكييف",
          price: 250.0,
          stock: 50,
          supplierId: supplier2.id,
          companyId: company2.id,
        },
      })
    );

    accessories.push(
      await prisma.accessory.create({
        data: {
          name: "مادة التثبيت والعزل",
          price: 500.0,
          stock: 80,
          supplierId: supplier2.id,
          companyId: company2.id,
        },
      })
    );

    accessories.push(
      await prisma.accessory.create({
        data: {
          name: "أنابيب نحاسية لتكييف",
          price: 600.0,
          stock: 40,
          supplierId: supplier3.id,
          companyId: company3.id,
        },
      })
    );

    console.log(`✅ Created ${accessories.length} accessories\n`);

    // ==========================================
    // 10. Create Product-Accessory Relations
    // ==========================================
    console.log("🔗 Creating product-accessory relations...");
    await prisma.productAccessory.createMany({
      data: [
        { productId: products[0].id, accessoryId: accessories[0].id },
        { productId: products[0].id, accessoryId: accessories[1].id },
        { productId: products[1].id, accessoryId: accessories[0].id },
        { productId: products[2].id, accessoryId: accessories[0].id },
        { productId: products[3].id, accessoryId: accessories[2].id },
        { productId: products[3].id, accessoryId: accessories[3].id },
        { productId: products[4].id, accessoryId: accessories[2].id },
        { productId: products[4].id, accessoryId: accessories[3].id },
        { productId: products[5].id, accessoryId: accessories[2].id },
      ],
    });
    console.log(`✅ Created 9 product-accessory relations\n`);

    // ==========================================
    // 11. Create Services
    // ==========================================
    console.log("🛠️ Creating services...");
    const services = [];

    services.push(
      await prisma.service.create({
        data: {
          name: "تركيب فلتر مياه",
          description: "خدمة تركيب فلتر المياه في المنزل مع الضمان والاختبار",
          price: 300.0,
          companyId: company1.id,
        },
      })
    );

    services.push(
      await prisma.service.create({
        data: {
          name: "صيانة فلتر مياه",
          description: "خدمة صيانة دورية للفلتر تشمل تغيير الشمعات والتعقيم",
          price: 250.0,
          companyId: company1.id,
        },
      })
    );

    services.push(
      await prisma.service.create({
        data: {
          name: "تركيب تكييف",
          description:
            "خدمة تركيب التكييف مع التوصيلات الكهربائية والفراغات الهوائية",
          price: 500.0,
          companyId: company2.id,
        },
      })
    );

    services.push(
      await prisma.service.create({
        data: {
          name: "صيانة تكييف",
          description: "خدمة صيانة التكييف الدورية وتنظيف المراوح والفلاتر",
          price: 350.0,
          companyId: company2.id,
        },
      })
    );

    services.push(
      await prisma.service.create({
        data: {
          name: "استشارة فنية",
          description: "استشارة فنية لاختيار المنتج المناسب للعميل",
          price: 100.0,
          companyId: company3.id,
        },
      })
    );

    services.push(
      await prisma.service.create({
        data: {
          name: "صيانة الطوارئ",
          description: "خدمة الصيانة الطارئة والسريعة للعملاء الكبار",
          price: 400.0,
          companyId: company3.id,
        },
      })
    );

    console.log(`✅ Created ${services.length} services\n`);

    // ==========================================
    // 12. Create Employees
    // ==========================================
    console.log("👷 Creating employees...");
    const employees = [];

    // Company 1 Employees
    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "محمد أحمد السيد",
          nationalId: "29001011234570",
          idCardImage: "https://example.com/ids/emp1.jpg",
          role: "SalesRep",
          primaryNumber: "01012340000",
          secondaryNumber: "01123450000",
          city: "القاهرة",
          district: "النزهة",
          governorate: "القاهرة",
          companyId: company1.id,
          isEmployed: true,
        },
      })
    );

    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "علي حسين محمود",
          nationalId: "28805051234571",
          idCardImage: "https://example.com/ids/emp2.jpg",
          role: "Technician",
          primaryNumber: "01098760000",
          secondaryNumber: "01123460000",
          city: "القاهرة",
          district: "النزهة",
          governorate: "القاهرة",
          companyId: company1.id,
          isEmployed: true,
        },
      })
    );

    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "نور أحمد عبد الله",
          nationalId: "29505151234572",
          role: "Technician",
          primaryNumber: "01054321111",
          city: "القاهرة",
          district: "مدينة نصر",
          governorate: "القاهرة",
          companyId: company1.id,
          isEmployed: true,
        },
      })
    );

    // Company 2 Employees
    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "يوسف عبد الله إبراهيم",
          nationalId: "29203031234573",
          idCardImage: "https://example.com/ids/emp4.jpg",
          role: "SalesRep",
          primaryNumber: "01187650000",
          secondaryNumber: "01298760000",
          city: "الجيزة",
          district: "المهندسين",
          governorate: "الجيزة",
          companyId: company2.id,
          isEmployed: true,
        },
      })
    );

    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "حسام محمد علي",
          nationalId: "28607071234574",
          idCardImage: "https://example.com/ids/emp5.jpg",
          role: "Technician",
          primaryNumber: "01054320000",
          city: "الجيزة",
          district: "الدقي",
          governorate: "الجيزة",
          companyId: company2.id,
          isEmployed: true,
        },
      })
    );

    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "أمل سعيد عبد العزيز",
          nationalId: "29909091234575",
          role: "SalesRep",
          primaryNumber: "01165432222",
          city: "الجيزة",
          district: "المهندسين",
          governorate: "الجيزة",
          companyId: company2.id,
          isEmployed: false,
        },
      })
    );

    // Company 3 Employees
    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "عمر حسن محمود",
          nationalId: "28703031234576",
          idCardImage: "https://example.com/ids/emp7.jpg",
          role: "SalesRep",
          primaryNumber: "01187654321",
          city: "الإسكندرية",
          district: "سموحة",
          governorate: "الإسكندرية",
          companyId: company3.id,
          isEmployed: true,
        },
      })
    );

    employees.push(
      await prisma.employee.create({
        data: {
          fullName: "مريم إبراهيم أحمد",
          nationalId: "29111121234577",
          role: "Technician",
          primaryNumber: "01276543333",
          city: "الإسكندرية",
          district: "محطة الرمل",
          governorate: "الإسكندرية",
          companyId: company3.id,
          isEmployed: true,
        },
      })
    );

    console.log(`✅ Created ${employees.length} employees\n`);

    // ==========================================
    // 13. Create Customers
    // ==========================================
    console.log("👥 Creating customers...");
    const customers = [];

    // Company 1 Customers
    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "خالد عبد الرحمن علي",
          customerType: "Installation",
          nationalId: "29801011234567",
          idCardImage: "https://example.com/ids/cust1.jpg",
          idCardImagePublicId: "cust1_id_card",
          primaryNumber: "01012345678",
          secondaryNumber: "01123456789",
          governorate: "القاهرة",
          city: "مدينة نصر",
          district: "الحي الأول",
          companyId: company1.id,
        },
      })
    );

    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "سارة محمود أحمد",
          customerType: "Maintenance",
          nationalId: "29505051234568",
          primaryNumber: "01098765432",
          governorate: "القاهرة",
          city: "النزهة",
          district: "شارع الثورة",
          companyId: company1.id,
        },
      })
    );

    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "فاطمة سعيد عبد الهادي",
          customerType: "Installation",
          nationalId: "29301011234569",
          primaryNumber: "01156789012",
          governorate: "القاهرة",
          city: "حلوان",
          district: "شارع النيل",
          companyId: company1.id,
        },
      })
    );

    // Company 2 Customers
    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "عمر حسن محمد",
          customerType: "Installation",
          nationalId: "28703031234570",
          idCardImage: "https://example.com/ids/cust4.jpg",
          primaryNumber: "01187654321",
          governorate: "الجيزة",
          city: "المهندسين",
          district: "شارع جامعة الدول",
          companyId: company2.id,
        },
      })
    );

    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "ليلى محمد إبراهيم",
          customerType: "Maintenance",
          nationalId: "29609101234571",
          primaryNumber: "01265432109",
          governorate: "الجيزة",
          city: "الدقي",
          district: "شارع البطل",
          companyId: company2.id,
        },
      })
    );

    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "أحمد علي عبد الله",
          customerType: "Installation",
          nationalId: "28507081234572",
          primaryNumber: "01354321098",
          governorate: "الجيزة",
          city: "الجيزة",
          district: "البدرشين",
          companyId: company2.id,
        },
      })
    );

    // Company 3 Customers
    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "نادية حسين أحمد",
          customerType: "Maintenance",
          nationalId: "29810111234573",
          idCardImage: "https://example.com/ids/cust7.jpg",
          primaryNumber: "01443210987",
          governorate: "الإسكندرية",
          city: "سموحة",
          district: "شارع فوزي معاذ",
          companyId: company3.id,
        },
      })
    );

    customers.push(
      await prisma.customer.create({
        data: {
          fullName: "محمود سعد محمود",
          customerType: "Installation",
          nationalId: "28609121234574",
          primaryNumber: "01532109876",
          governorate: "الإسكندرية",
          city: "محطة الرمل",
          district: "شارع سعد زغلول",
          companyId: company3.id,
        },
      })
    );

    console.log(`✅ Created ${customers.length} customers\n`);

    // ==========================================
    // 14. Create Customer Maintenance Status
    // ==========================================
    console.log("📋 Creating customer maintenance statuses...");
    await prisma.customerMaintenanceStatus.createMany({
      data: [
        {
          customerId: customers[0].id,
          companyId: company1.id,
          status: "Active",
          notes: "العميل نشط - عقد سنوي",
        },
        {
          customerId: customers[1].id,
          companyId: company1.id,
          status: "Active",
          notes: "العميل نشط - صيانة دورية",
        },
        {
          customerId: customers[2].id,
          companyId: company1.id,
          status: "Active",
          notes: "عميل جديد - تركيب حديث",
        },
        {
          customerId: customers[3].id,
          companyId: company2.id,
          status: "Active",
          notes: "عميل كبير - عقد طويل الأجل",
        },
        {
          customerId: customers[4].id,
          companyId: company2.id,
          status: "Inactive",
          inactiveReason: "لم يجدد الاشتراك",
          notes: "العميل توقف عن الخدمة منذ 3 أشهر",
        },
        {
          customerId: customers[5].id,
          companyId: company2.id,
          status: "Active",
          notes: "عميل متوسط - صيانة شهرية",
        },
        {
          customerId: customers[6].id,
          companyId: company3.id,
          status: "Active",
          notes: "عميل سكني - خدمات دورية",
        },
        {
          customerId: customers[7].id,
          companyId: company3.id,
          status: "Active",
          notes: "عميل تجاري - صيانة أسبوعية",
        },
      ],
    });
    console.log(`✅ Created 8 customer maintenance statuses\n`);

    // ==========================================
    // 15. Create Invoices - Cash Sales
    // ==========================================
    console.log("🧾 Creating invoices...");
    const invoices = [];

    // Invoice 1: Cash Sale (Full Payment)
    invoices.push(
      await prisma.invoice.create({
        data: {
          customerId: customers[0].id,
          salesRepId: employees[0].id,
          technicianId: employees[1].id,
          companyId: company1.id,
          totalAmount: 4050.0,
          discountAmount: 0,
          saleType: "Cash",
          maintenancePeriod: 12,
          paidAtContract: 0,
          paidAtInstallation: 4050.0,
          installationCostType: "Percentage",
          installationCostValue: 10,
          contractDate: new Date("2025-10-15"),
          installationDate: new Date("2025-10-20"),
          contractNotes: "عميل ممتاز - دفع كامل المبلغ نقداً في التركيب",
        },
      })
    );

    // Invoice 2: Cash Sale with Discount
    invoices.push(
      await prisma.invoice.create({
        data: {
          customerId: customers[1].id,
          salesRepId: employees[0].id,
          technicianId: employees[2].id,
          companyId: company1.id,
          totalAmount: 2800.0,
          discountAmount: 280.0,
          saleType: "Cash",
          maintenancePeriod: 6,
          paidAtContract: 1500.0,
          paidAtInstallation: 1020.0,
          installationCostType: "Fixed",
          installationCostValue: 200.0,
          contractDate: new Date("2025-09-20"),
          installationDate: new Date("2025-09-25"),
          contractNotes: "خصم 10% - عميل قديم",
        },
      })
    );

    // Invoice 3: Company 2 Cash Sale
    invoices.push(
      await prisma.invoice.create({
        data: {
          customerId: customers[3].id,
          salesRepId: employees[3].id,
          technicianId: employees[4].id,
          companyId: company2.id,
          totalAmount: 9500.0,
          discountAmount: 500.0,
          saleType: "Cash",
          maintenancePeriod: 24,
          paidAtContract: 5000.0,
          paidAtInstallation: 4000.0,
          installationCostType: "Percentage",
          installationCostValue: 15,
          contractDate: new Date("2025-08-10"),
          installationDate: new Date("2025-08-15"),
          contractNotes: "تكييف 2 حصان - عميل تجاري",
        },
      })
    );

    // Invoice 4: Company 3 Cash Sale
    invoices.push(
      await prisma.invoice.create({
        data: {
          customerId: customers[6].id,
          salesRepId: employees[6].id,
          technicianId: employees[7].id,
          companyId: company3.id,
          totalAmount: 5500.0,
          discountAmount: 0,
          saleType: "Cash",
          maintenancePeriod: 12,
          paidAtContract: 2000.0,
          paidAtInstallation: 3500.0,
          installationCostType: "Fixed",
          installationCostValue: 350.0,
          contractDate: new Date("2025-11-01"),
          installationDate: new Date("2025-11-05"),
          contractNotes: "عميل سكني - دفع كامل المبلغ",
        },
      })
    );

    console.log(`✅ Created ${invoices.length} cash invoices\n`);

    // ==========================================
    // 16. Create Invoice Items for Cash Invoices
    // ==========================================
    console.log("📝 Creating invoice items...");
    let itemCount = 0;

    // Items for Invoice 1
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoices[0].id,
          productId: products[0].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 3500.0,
          subtotal: 3500.0,
        },
        {
          invoiceId: invoices[0].id,
          serviceId: services[0].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 300.0,
          subtotal: 300.0,
        },
        {
          invoiceId: invoices[0].id,
          accessoryId: accessories[0].id,
          companyId: company1.id,
          quantity: 2,
          unitPrice: 150.0,
          subtotal: 300.0,
        },
      ],
    });
    itemCount += 3;

    // Items for Invoice 2
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoices[1].id,
          productId: products[1].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 2500.0,
          subtotal: 2500.0,
        },
        {
          invoiceId: invoices[1].id,
          accessoryId: accessories[1].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 350.0,
          subtotal: 350.0,
        },
      ],
    });
    itemCount += 2;

    // Items for Invoice 3
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoices[2].id,
          productId: products[4].id,
          companyId: company2.id,
          quantity: 1,
          unitPrice: 10500.0,
          subtotal: 10500.0,
        },
        {
          invoiceId: invoices[2].id,
          serviceId: services[2].id,
          companyId: company2.id,
          quantity: 1,
          unitPrice: 500.0,
          subtotal: 500.0,
        },
        {
          invoiceId: invoices[2].id,
          accessoryId: accessories[3].id,
          companyId: company2.id,
          quantity: 2,
          unitPrice: 500.0,
          subtotal: 1000.0,
        },
      ],
    });
    itemCount += 3;

    // Items for Invoice 4
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoices[3].id,
          productId: products[6].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 4500.0,
          subtotal: 4500.0,
        },
        {
          invoiceId: invoices[3].id,
          serviceId: services[4].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 100.0,
          subtotal: 100.0,
        },
        {
          invoiceId: invoices[3].id,
          accessoryId: accessories[4].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 600.0,
          subtotal: 600.0,
        },
      ],
    });
    itemCount += 3;

    console.log(`✅ Created ${itemCount} invoice items\n`);

    // ==========================================
    // 17. Create Installment Invoices
    // ==========================================
    console.log("💳 Creating installment invoices...");

    // Installment Invoice 1
    const invoice5 = await prisma.invoice.create({
      data: {
        customerId: customers[2].id,
        salesRepId: employees[0].id,
        technicianId: employees[1].id,
        companyId: company1.id,
        totalAmount: 2800.0,
        discountAmount: 200.0,
        saleType: "Installment",
        maintenancePeriod: 12,
        paidAtContract: 500.0,
        paidAtInstallation: 300.0,
        installationCostType: "Fixed",
        installationCostValue: 250.0,
        contractDate: new Date("2025-11-01"),
        installationDate: new Date("2025-11-05"),
        contractNotes: "تقسيط على 6 أشهر - مقدم 800 جنيه",
      },
    });

    invoices.push(invoice5);

    // Installment Invoice 2
    const invoice6 = await prisma.invoice.create({
      data: {
        customerId: customers[4].id,
        salesRepId: employees[3].id,
        technicianId: employees[4].id,
        companyId: company2.id,
        totalAmount: 6500.0,
        discountAmount: 500.0,
        saleType: "Installment",
        maintenancePeriod: 18,
        paidAtContract: 1000.0,
        paidAtInstallation: 800.0,
        installationCostType: "Percentage",
        installationCostValue: 12,
        contractDate: new Date("2025-10-20"),
        installationDate: new Date("2025-10-25"),
        contractNotes: "تكييف 1.5 حصان - تقسيط 12 شهر",
      },
    });

    invoices.push(invoice6);

    // Installment Invoice 3
    const invoice7 = await prisma.invoice.create({
      data: {
        customerId: customers[7].id,
        salesRepId: employees[6].id,
        technicianId: employees[7].id,
        companyId: company3.id,
        totalAmount: 7200.0,
        discountAmount: 300.0,
        saleType: "Installment",
        maintenancePeriod: 24,
        paidAtContract: 1500.0,
        paidAtInstallation: 1200.0,
        installationCostType: "Percentage",
        installationCostValue: 10,
        contractDate: new Date("2025-12-01"),
        installationDate: new Date("2025-12-05"),
        contractNotes: "عميل تجاري - تقسيط 8 أشهر",
      },
    });

    invoices.push(invoice7);

    console.log(`✅ Created 3 installment invoices\n`);

    // ==========================================
    // 18. Create Invoice Items for Installment Invoices
    // ==========================================
    console.log("📝 Creating installment invoice items...");

    // Items for Invoice 5
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice5.id,
          productId: products[2].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 1500.0,
          subtotal: 1500.0,
        },
        {
          invoiceId: invoice5.id,
          serviceId: services[1].id,
          companyId: company1.id,
          quantity: 1,
          unitPrice: 250.0,
          subtotal: 250.0,
        },
        {
          invoiceId: invoice5.id,
          accessoryId: accessories[0].id,
          companyId: company1.id,
          quantity: 3,
          unitPrice: 150.0,
          subtotal: 450.0,
        },
      ],
    });

    // Items for Invoice 6
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice6.id,
          productId: products[3].id,
          companyId: company2.id,
          quantity: 1,
          unitPrice: 8500.0,
          subtotal: 8500.0,
        },
        {
          invoiceId: invoice6.id,
          serviceId: services[2].id,
          companyId: company2.id,
          quantity: 1,
          unitPrice: 500.0,
          subtotal: 500.0,
        },
        {
          invoiceId: invoice6.id,
          accessoryId: accessories[2].id,
          companyId: company2.id,
          quantity: 2,
          unitPrice: 250.0,
          subtotal: 500.0,
        },
      ],
    });

    // Items for Invoice 7
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice7.id,
          productId: products[5].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 6500.0,
          subtotal: 6500.0,
        },
        {
          invoiceId: invoice7.id,
          serviceId: services[5].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 400.0,
          subtotal: 400.0,
        },
        {
          invoiceId: invoice7.id,
          accessoryId: accessories[4].id,
          companyId: company3.id,
          quantity: 1,
          unitPrice: 600.0,
          subtotal: 600.0,
        },
      ],
    });

    console.log(`✅ Created installment invoice items\n`);

    // ==========================================
    // 19. Create Installment Plans
    // ==========================================
    console.log("📅 Creating installment plans...");

    // Plan 1: 6 months
    const remainingAmount1 = 2800.0 - 500.0 - 300.0; // 2000
    const installmentPlans = [];

    const plan1 = await prisma.installment.create({
      data: {
        invoiceId: invoice5.id,
        numberOfMonths: 6,
        monthlyInstallment: remainingAmount1 / 6,
        collectionStartDate: new Date("2025-12-01"),
        collectionEndDate: new Date("2026-05-01"),
      },
    });
    installmentPlans.push(plan1);

    // Plan 2: 12 months
    const remainingAmount2 = 6500.0 - 1000.0 - 800.0; // 4700
    const plan2 = await prisma.installment.create({
      data: {
        invoiceId: invoice6.id,
        numberOfMonths: 12,
        monthlyInstallment: remainingAmount2 / 12,
        collectionStartDate: new Date("2025-11-01"),
        collectionEndDate: new Date("2026-10-01"),
      },
    });
    installmentPlans.push(plan2);

    // Plan 3: 8 months
    const remainingAmount3 = 7200.0 - 1500.0 - 1200.0; // 4500
    const plan3 = await prisma.installment.create({
      data: {
        invoiceId: invoice7.id,
        numberOfMonths: 8,
        monthlyInstallment: remainingAmount3 / 8,
        collectionStartDate: new Date("2026-01-01"),
        collectionEndDate: new Date("2026-08-01"),
      },
    });
    installmentPlans.push(plan3);

    console.log(`✅ Created ${installmentPlans.length} installment plans\n`);

    // ==========================================
    // 20. Create Installment Payments
    // ==========================================
    console.log("💰 Creating installment payments...");
    let paymentCount = 0;

    // Payments for Plan 1
    for (let i = 0; i < plan1.numberOfMonths; i++) {
      const dueDate = new Date("2025-12-01");
      dueDate.setMonth(dueDate.getMonth() + i);

      const isPaid = i < 3;
      const paidDate = isPaid ? new Date(dueDate) : null;

      await prisma.installmentPayment.create({
        data: {
          installmentId: plan1.id,
          customerId: customers[2].id,
          amountDue: plan1.monthlyInstallment,
          amountPaid: isPaid ? plan1.monthlyInstallment : 0,
          carryoverAmount: 0,
          overdueAmount: i > 2 ? plan1.monthlyInstallment : 0,
          status: isPaid ? "Paid" : i === 3 ? "Partial" : "Pending",
          dueDate: dueDate,
          paymentDate: paidDate,
          notes: isPaid
            ? "تم الدفع في الموعد"
            : i === 3
            ? "تأخير 15 يوم"
            : null,
        },
      });
      paymentCount++;
    }

    // Payments for Plan 2
    for (let i = 0; i < plan2.numberOfMonths; i++) {
      const dueDate = new Date("2025-11-01");
      dueDate.setMonth(dueDate.getMonth() + i);

      const isPaid = i === 0;
      const paidDate = isPaid ? dueDate : null;

      await prisma.installmentPayment.create({
        data: {
          installmentId: plan2.id,
          customerId: customers[4].id,
          amountDue: plan2.monthlyInstallment,
          amountPaid: isPaid ? plan2.monthlyInstallment : 0,
          carryoverAmount: 0,
          overdueAmount: i > 0 ? plan2.monthlyInstallment : 0,
          status: isPaid ? "Paid" : "Pending",
          dueDate: dueDate,
          paymentDate: paidDate,
          notes: isPaid ? "دفع بطاقة ائتمان" : null,
        },
      });
      paymentCount++;
    }

    // Payments for Plan 3 (New plan - no payments yet)
    for (let i = 0; i < plan3.numberOfMonths; i++) {
      const dueDate = new Date("2026-01-01");
      dueDate.setMonth(dueDate.getMonth() + i);

      await prisma.installmentPayment.create({
        data: {
          installmentId: plan3.id,
          customerId: customers[7].id,
          amountDue: plan3.monthlyInstallment,
          amountPaid: 0,
          carryoverAmount: 0,
          overdueAmount: 0,
          status: "Pending",
          dueDate: dueDate,
          notes: null,
        },
      });
      paymentCount++;
    }

    console.log(`✅ Created ${paymentCount} installment payments\n`);

    // ==========================================
    // 21. Create Maintenance Records
    // ==========================================
    console.log("🔧 Creating maintenance records...");

    await prisma.maintenance.createMany({
      data: [
        {
          customerId: customers[0].id,
          serviceId: services[1].id,
          productId: products[0].id,
          technicianId: employees[1].id,
          companyId: company1.id,
          maintenanceDate: new Date("2025-11-10"),
          price: 250.0,
          status: "Completed",
          notes: "تم تغيير الشمعات - الفلتر يعمل بكفاءة عالية - العميل راضٍ",
        },
        {
          customerId: customers[1].id,
          serviceId: services[1].id,
          productId: products[1].id,
          technicianId: employees[2].id,
          companyId: company1.id,
          maintenanceDate: new Date("2025-12-01"),
          price: 250.0,
          status: "Pending",
          notes: "موعد الصيانة الدورية القادم - تم إشعار العميل",
        },
        {
          customerId: customers[2].id,
          serviceId: services[0].id,
          productId: products[2].id,
          technicianId: employees[1].id,
          companyId: company1.id,
          maintenanceDate: new Date("2025-10-25"),
          price: 300.0,
          status: "Completed",
          notes: "تركيب الفلتر 3 مراحل - التركيب سلس والعميل راضٍ",
        },
        {
          customerId: customers[3].id,
          serviceId: services[3].id,
          productId: products[4].id,
          technicianId: employees[4].id,
          companyId: company2.id,
          maintenanceDate: new Date("2025-10-25"),
          price: 350.0,
          status: "Completed",
          notes: "تنظيف شامل للتكييف - استبدال الفلتر - يعمل بكفاءة",
        },
        {
          customerId: customers[5].id,
          serviceId: services[2].id,
          productId: products[3].id,
          technicianId: employees[4].id,
          companyId: company2.id,
          maintenanceDate: new Date("2025-11-20"),
          price: 500.0,
          status: "Pending",
          notes: "جدولة تركيب التكييف - الانتظار لتنسيق الموعد",
        },
        {
          customerId: customers[6].id,
          serviceId: services[0].id,
          productId: products[6].id,
          technicianId: employees[7].id,
          companyId: company3.id,
          maintenanceDate: new Date("2025-11-05"),
          price: 350.0,
          status: "Completed",
          notes: "تركيب المضخة - اختبار الأداء نجح",
        },
        {
          customerId: customers[7].id,
          serviceId: services[5].id,
          productId: products[5].id,
          technicianId: employees[7].id,
          companyId: company3.id,
          maintenanceDate: new Date("2025-12-10"),
          price: 400.0,
          status: "Overdue",
          notes: "صيانة طارئة - تأخير في الخدمة - تم الاعتذار",
        },
        {
          customerId: customers[4].id,
          serviceId: services[3].id,
          productId: products[3].id,
          technicianId: employees[4].id,
          companyId: company2.id,
          maintenanceDate: new Date("2026-01-15"),
          price: 350.0,
          status: "Cancelled",
          notes: "ألغى العميل الصيانة - لم يعد مهتماً",
        },
      ],
    });
    console.log(`✅ Created 8 maintenance records\n`);

    // ==========================================
    // 22. Create Subscriptions
    // ==========================================
    console.log("📋 Creating subscriptions...");
    const allPlans = await prisma.subscriptionPlan.findMany();

    const subscriptions = [];

    const sub1 = await prisma.subscription.create({
      data: {
        companyId: company1.id,
        planId: allPlans.find((p) => p.name === "Yearly").id,
        status: "active",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        autoRenew: true,
      },
    });
    subscriptions.push(sub1);

    const sub2 = await prisma.subscription.create({
      data: {
        companyId: company2.id,
        planId: allPlans.find((p) => p.name === "Quarterly").id,
        status: "active",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-11-30"),
        autoRenew: false,
      },
    });
    subscriptions.push(sub2);

    const sub3 = await prisma.subscription.create({
      data: {
        companyId: company3.id,
        planId: allPlans.find((p) => p.name === "Monthly").id,
        status: "active",
        startDate: new Date("2025-11-01"),
        endDate: new Date("2025-11-30"),
        autoRenew: true,
      },
    });
    subscriptions.push(sub3);

    // Subscription for Company 4 (Expired)
    const sub4 = await prisma.subscription.create({
      data: {
        companyId: company4.id,
        planId: allPlans.find((p) => p.name === "Yearly").id,
        status: "expired", // اشتراك منتهي الصلاحية
        startDate: new Date("2023-06-30"),
        endDate: new Date("2024-06-30"),
        autoRenew: false,
        cancelledAt: null,
      },
    });
    subscriptions.push(sub4);

    console.log(`✅ Created ${subscriptions.length} subscriptions\n`);

    // ==========================================
    // 23. Create Subscription Invoices
    // ==========================================
    console.log("📄 Creating subscription invoices...");

    await prisma.subscriptionInvoice.createMany({
      data: [
        {
          companyId: company1.id,
          subscriptionId: sub1.id,
          planName: "Yearly",
          amount: 2691.0,
          durationDays: 365,
          paymentMethod: "stripe",
          paymentStatus: "paid",
          stripePaymentId: "pi_1234567890stripe",
          stripeSessionId: "cs_test_123456stripe",
          paidAt: new Date("2025-01-01"),
          notes: "دفع سنوي كامل",
        },
        {
          companyId: company2.id,
          subscriptionId: sub2.id,
          planName: "Quarterly",
          amount: 765.75,
          durationDays: 90,
          paymentMethod: "stripe",
          paymentStatus: "paid",
          stripePaymentId: "pi_0987654321stripe",
          paidAt: new Date("2025-09-01"),
          notes: "دفع ربع سنوي",
        },
        {
          companyId: company3.id,
          subscriptionId: sub3.id,
          planName: "Monthly",
          amount: 299.0,
          durationDays: 30,
          paymentMethod: "bank_transfer",
          paymentStatus: "pending",
          notes: "تحويل بنكي - في الانتظار",
        },
        {
          companyId: company1.id,
          planName: "Monthly",
          amount: 299.0,
          durationDays: 30,
          paymentMethod: "cash",
          paymentStatus: "paid",
          paidAt: new Date("2025-11-15"),
          notes: "دفع شهري نقداً",
        },
        {
          companyId: company4.id,
          subscriptionId: sub4.id,
          planName: "Yearly",
          amount: 2691.0,
          durationDays: 365,
          paymentMethod: "stripe",
          paymentStatus: "paid",
          stripePaymentId: "pi_expired_company_stripe",
          paidAt: new Date("2023-06-30"),
          notes: "اشتراك منتهي الصلاحية - 30 يونيو 2024",
        },
      ],
    });
    console.log(`✅ Created 4 subscription invoices\n`);

    // ==========================================
    // 24. Create Subscription Alerts
    // ==========================================
    console.log("⚠️ Creating subscription alerts...");

    await prisma.subscriptionAlert.createMany({
      data: [
        {
          subscriptionId: sub1.id,
          alertType: "expiry_7days",
          message: "تنبيه: انتهاء الاشتراك خلال 7 أيام",
          messageAr: "تنبيه: انتهاء الاشتراك خلال 7 أيام",
          isRead: false,
        },
        {
          subscriptionId: sub2.id,
          alertType: "expiry_3days",
          message: "تنبيه عاجل: انتهاء الاشتراك خلال 3 أيام",
          messageAr: "تنبيه عاجل: انتهاء الاشتراك خلال 3 أيام",
          isRead: true,
        },
        {
          subscriptionId: sub3.id,
          alertType: "expiry_1day",
          message: "تنبيه حرج: ينتهي الاشتراك غداً",
          messageAr: "تنبيه حرج: ينتهي الاشتراك غداً",
          isRead: false,
        },
        {
          subscriptionId: sub4.id,
          alertType: "expired",
          message: "تنبيه حرج: الاشتراك منتهي الصلاحية",
          messageAr: "تنبيه حرج: الاشتراك منتهي الصلاحية",
          isRead: false,
        },
      ],
    });
    console.log(`✅ Created 3 subscription alerts\n`);

    // ==========================================
    // Summary & Final Report
    // ==========================================
    console.log("\n✨ ========================================");
    console.log("✨ Seeding Completed Successfully!");
    console.log("✨ ========================================\n");

    console.log("📊 Comprehensive Summary:\n");

    console.log("🏢 Companies:");
    console.log(`   ✓ Company 1: ${company1.name}`);
    console.log(`   ✓ Company 2: ${company2.name}`);
    console.log(`   ✓ Company 3: ${company3.name}`);
    console.log(`   ✓ Company 4: ${company4.name} (EXPIRED)`);

    console.log("\n👤 Users:");
    console.log(`   ✓ Total Users: 8`);
    console.log(`   ✓ Developers: 1`);
    console.log(`   ✓ Managers: 4`);
    console.log(`   ✓ Employees: 3`);
    console.log(`   ✓ Inactive: 1`);

    console.log("\n⏳ Pending Users:");
    console.log(`   ✓ Total: 2`);
    console.log(`   ✓ Verified: 1`);
    console.log(`   ✓ Unverified: 1`);

    console.log("\n🔐 Password Resets:");
    console.log(`   ✓ Total: 2`);
    console.log(`   ✓ Active: 1`);
    console.log(`   ✓ Used: 1`);

    console.log("\n🏭 Business Data:");
    console.log(`   ✓ Suppliers: 3`);
    console.log(`   ✓ Products: ${products.length}`);
    console.log(`   ✓ Accessories: ${accessories.length}`);
    console.log(`   ✓ Services: ${services.length}`);
    console.log(`   ✓ Employees: ${employees.length}`);
    console.log(`   ✓ Customers: ${customers.length}`);

    console.log("\n📋 Maintenance Tracking:");
    console.log(`   ✓ Customer Maintenance Statuses: 8`);
    console.log(`   ✓ Status: Active (7), Inactive (1)`);

    console.log("\n💼 Sales & Invoices:");
    console.log(`   ✓ Total Invoices: ${invoices.length}`);
    console.log(`   ✓ Cash Sales: 4`);
    console.log(`   ✓ Installment Sales: 3`);
    console.log(`   ✓ Total Invoice Items: ${itemCount + 9}`);

    console.log("\n💳 Installment Plans:");
    console.log(`   ✓ Total Plans: ${installmentPlans.length}`);
    console.log(
      `   ✓ Plan 1: 6 months @ ₊${plan1.monthlyInstallment.toFixed(
        2
      )} per month`
    );
    console.log(
      `   ✓ Plan 2: 12 months @ ₊${plan2.monthlyInstallment.toFixed(
        2
      )} per month`
    );
    console.log(
      `   ✓ Plan 3: 8 months @ ₊${plan3.monthlyInstallment.toFixed(
        2
      )} per month`
    );
    console.log(`   ✓ Total Installment Payments: ${paymentCount}`);
    console.log(`   ✓ Paid Payments: 4`);
    console.log(`   ✓ Pending Payments: ${paymentCount - 4}`);

    console.log("\n🔧 Maintenance Records:");
    console.log(`   ✓ Total Records: 8`);
    console.log(`   ✓ Completed: 4`);
    console.log(`   ✓ Pending: 2`);
    console.log(`   ✓ Overdue: 1`);
    console.log(`   ✓ Cancelled: 1`);

    console.log("\n📋 Subscription Plans:");
    console.log(`   ✓ Trial: Free for 10 days`);
    console.log(`   ✓ Monthly: ₊299 for 30 days`);
    console.log(`   ✓ Quarterly: ₊765.75 for 90 days (Save 15%)`);
    console.log(`   ✓ Yearly: ₊2,691 for 365 days (Save 25%)`);

    console.log("\n📊 Company Subscriptions:");
    console.log(`   ✓ Company 1: Yearly (Active)`);
    console.log(`   ✓ Company 2: Quarterly (Active)`);
    console.log(`   ✓ Company 3: Monthly (Active)`);
    console.log(`   ✓ Company 4: Yearly (EXPIRED) 🚨`);

    console.log("\n📄 Subscription Invoices:");
    console.log(`   ✓ Total: 5`);
    console.log(`   ✓ Paid: 4`);
    console.log(`   ✓ Pending: 1`);
    console.log(
      `   ✓ Payment Methods: Stripe (3), Bank Transfer (1), Cash (1)`
    );

    console.log("\n⚠️ Subscription Alerts:");
    console.log(`   ✓ Total Alerts: 4`);
    console.log(`   ✓ Unread: 3`);
    console.log(`   ✓ Read: 1`);
    console.log(
      `   ✓ Alert Types: 7 days (1), 3 days (1), 1 day (1), Expired (1) 🚨`
    );

    console.log("\n💰 Financial Summary:");
    const totalCashSales = 4050.0 + 2800.0 + 9500.0 + 5500.0;
    const totalInstallmentSales = 2800.0 + 6500.0 + 7200.0;
    const totalSales = totalCashSales + totalInstallmentSales;
    const totalDiscounts = 0 + 280.0 + 500.0 + 0 + 200.0 + 500.0 + 300.0;
    const subscriptionRevenue = 2691.0 + 765.75 + 299.0 + 299.0;

    console.log(`   ✓ Total Cash Sales: ₊${totalCashSales.toFixed(2)}`);
    console.log(
      `   ✓ Total Installment Sales: ₊${totalInstallmentSales.toFixed(2)}`
    );
    console.log(`   ✓ Total Sales (Invoice): ₊${totalSales.toFixed(2)}`);
    console.log(`   ✓ Total Discounts Given: ₊${totalDiscounts.toFixed(2)}`);
    console.log(
      `   ✓ Subscription Revenue: ₊${subscriptionRevenue.toFixed(2)}`
    );
    console.log(
      `   ✓ Combined Revenue: ₊${(totalSales + subscriptionRevenue).toFixed(2)}`
    );

    console.log("\n📈 Payment Tracking:");
    const totalPaid =
      4050.0 +
      1500.0 +
      1020.0 +
      5000.0 +
      4000.0 +
      2000.0 +
      3500.0 +
      500.0 +
      1000.0 +
      800.0;
    const totalRemaining = 800.0 + 3700.0 + 4700.0 + 4500.0;
    console.log(
      `   ✓ Total Paid (at contract + installation): ₊${totalPaid.toFixed(2)}`
    );
    console.log(
      `   ✓ Total Installments Remaining: ₊${totalRemaining.toFixed(2)}`
    );
    console.log(`   ✓ Collection Period: Dec 2025 - Oct 2026`);

    console.log("\n✨ ========================================");
    console.log("✨ Database is ready for use!");
    console.log("✨ ========================================\n");
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
