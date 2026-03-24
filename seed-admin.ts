import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding admin user...')
  
  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@codeacademyug.org' }
  })
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists')
    console.log('   Email: admin@codeacademyug.org')
    console.log('   Password: Admin123!')
    return
  }
  
  // Create admin user
  const hashedPassword = await hash('Admin123!', 12)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@codeacademyug.org',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    }
  })
  
  console.log('✅ Admin user created successfully!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('   Email: admin@codeacademyug.org')
  console.log('   Password: Admin123!')
  console.log('')
  console.log('⚠️  Please change the password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })