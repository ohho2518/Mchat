import { PrismaClient } from "@prisma/client"
import { seedCategories } from "../src/data/seedCategories"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding default categories...")

  for (const cat of seedCategories) {
    const category = await prisma.category.upsert({
      where: {
        id: `default-${cat.name}`,
      },
      update: {},
      create: {
        id: `default-${cat.name}`,
        userId: null,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        isDefault: true,
        isActive: true,
        keywords: {
          create: cat.keywords.map((kw) => ({ keyword: kw })),
        },
      },
    })
    console.log(`✓ ${category.name} (${category.type})`)
  }

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
