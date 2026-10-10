import { User } from '../models/User';

export async function seedDefaultAdmin(): Promise<void> {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@saferoute.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const existingUser = await User.findOne({ email: adminEmail });

    if (!existingUser) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
      });
      console.log(`[AdminSeeder] Successfully initialized default Admin account: ${adminEmail}`);
    } else if (existingUser.role !== 'admin') {
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      await existingUser.save();
      console.log(`[AdminSeeder] Upgraded account to Admin privileges: ${adminEmail}`);
    }
  } catch (error) {
    console.error('[AdminSeeder] Admin seed error:', error);
  }
}
