import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding subscription plans...");

  // حذف البيانات القديمة
  await prisma.subscriptionPlan.deleteMany({});

  // إنشاء الباقات
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
        price: 765.0, // 3 * 299 * 0.85
        durationDays: 90,
        features: [
          { en: "All Monthly features", ar: "جميع مميزات الباقة الشهرية" },
          { en: "Save 15%", ar: "وفر 15%" },
          { en: "Priority support", ar: "دعم ذو أولوية" },
          { en: "Quarterly business insights", ar: "تحليلات ربع سنوية" },
        ],
        isActive: true,
        displayOrder: 3,
      },
      {
        name: "Yearly",
        nameAr: "سنوي",
        description: "Best value - Save 25%",
        descriptionAr: "أفضل قيمة - وفر 25%",
        price: 2691.0, // 12 * 299 * 0.75
        durationDays: 365,
        features: [
          {
            en: "All Quarterly features",
            ar: "جميع مميزات الباقة الربع سنوية",
          },
          { en: "Save 25%", ar: "وفر 25%" },
          { en: "24/7 Premium support", ar: "دعم مميز على مدار الساعة" },
          {
            en: "Annual strategic consultation",
            ar: "استشارة استراتيجية سنوية",
          },
          { en: "Custom reports", ar: "تقارير مخصصة" },
        ],
        isActive: true,
        displayOrder: 4,
      },
    ],
  });

  console.log(`✅ Created ${plans.count} subscription plans`);
  console.log("\n📋 Plans Summary:");

  const allPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { displayOrder: "asc" },
  });

  allPlans.forEach((plan) => {
    console.log(`\n   ${plan.nameAr} (${plan.name})`);
    console.log(`   💰 Price: ${plan.price} EGP`);
    console.log(`   📅 Duration: ${plan.durationDays} days`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
