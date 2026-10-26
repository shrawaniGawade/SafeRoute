import { User } from '../models/User';
import { getAdminEmails } from './env';

export async function seedDefaultAdmin(): Promise<void> {
  try {
    const adminEmails = getAdminEmails();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmails.length === 0 || !adminPassword) {
      console.warn('[AdminSeeder] Skipping administrator setup: set ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment.');
      return;
    }

    const adminName = process.env.ADMIN_NAME || 'System Admin';

    for (const adminEmail of adminEmails) {
      const existingUser = await User.findOne({ email: adminEmail }).select('+password');

      if (!existingUser) {
        await User.create({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isVerified: true,
        });
        console.log(`[AdminSeeder] Successfully initialized default Admin account: ${adminEmail}`);
      } else {
        let needsSave = false;
        if (existingUser.role !== 'admin') {
          existingUser.role = 'admin';
          needsSave = true;
        }
        if (!existingUser.isVerified) {
          existingUser.isVerified = true;
          needsSave = true;
        }
        const isPasswordMatch = await existingUser.comparePassword(adminPassword);
        if (!isPasswordMatch) {
          existingUser.password = adminPassword;
          needsSave = true;
        }
        if (needsSave) {
          await existingUser.save();
          console.log(`[AdminSeeder] Synchronized Admin privileges and credentials: ${adminEmail}`);
        }
      }
    }

    // Enforce RBAC invariant: Only configured admin accounts have role 'admin'
    if (typeof User.updateMany === 'function') {
      await User.updateMany(
        { email: { $nin: adminEmails }, role: 'admin' },
        { $set: { role: 'user' } }
      );
    }
  } catch (error) {
    console.error('[AdminSeeder] Admin seed error:', error);
  }
}
