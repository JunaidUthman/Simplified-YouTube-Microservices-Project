import { User, type UserProps } from './entities/user.entity.ts';

export class UsersRepository {
  private users: Map<string, User> = new Map();
  private isPgConnected = false;
  private pgClient: any = null;

  constructor(pgClient?: any) {
    if (pgClient) {
      this.pgClient = pgClient;
      this.isPgConnected = true;
    }
  }

  async initTable(): Promise<void> {
    if (!this.isPgConnected || !this.pgClient) return;

    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `;
    try {
      await this.pgClient.query(query);
    } catch (err) {
      console.warn('PostgreSQL table creation warning, using in-memory store:', (err as Error).message);
      this.isPgConnected = false;
    }
  }

  async create(user: User): Promise<User> {
    if (this.isPgConnected && this.pgClient) {
      const query = `
        INSERT INTO users (id, email, username, full_name, password, avatar_url, bio, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const values = [
        user.id,
        user.email,
        user.username,
        user.fullName,
        user.password,
        user.avatarUrl,
        user.bio,
        user.role,
        user.createdAt,
        user.updatedAt,
      ];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToUser(res.rows[0]);
    }

    this.users.set(user.id, user);
    return user;
  }

  async findAll(limit: number = 10, offset: number = 0, search: string = ''): Promise<{ users: User[]; total: number }> {
    if (this.isPgConnected && this.pgClient) {
      let whereClause = '';
      const params: any[] = [];

      if (search) {
        whereClause = `WHERE email ILIKE $1 OR username ILIKE $1 OR full_name ILIKE $1`;
        params.push(`%${search}%`);
      }

      const countRes = await this.pgClient.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      const limitParamIndex = params.length + 1;
      const offsetParamIndex = params.length + 2;
      params.push(limit, offset);

      const query = `
        SELECT * FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
      `;
      const res = await this.pgClient.query(query, params);
      const users = res.rows.map((row: any) => this.mapRowToUser(row));

      return { users, total };
    }

    let all = Array.from(this.users.values());
    if (search) {
      const term = search.toLowerCase();
      all = all.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term) ||
          u.fullName.toLowerCase().includes(term)
      );
    }
    const total = all.length;
    const paginated = all.slice(offset, offset + limit);
    return { users: paginated, total };
  }

  async findById(id: string): Promise<User | null> {
    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(`SELECT * FROM users WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      return this.mapRowToUser(res.rows[0]);
    }

    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
      if (res.rows.length === 0) return null;
      return this.mapRowToUser(res.rows[0]);
    }

    const found = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return found || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(`SELECT * FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
      if (res.rows.length === 0) return null;
      return this.mapRowToUser(res.rows[0]);
    }

    const found = Array.from(this.users.values()).find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    return found || null;
  }

  async update(id: string, updateData: Partial<UserProps>): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedUser = new User({
      ...existing,
      ...updateData,
      id, // Preserve ID
      updatedAt: new Date(),
    });

    if (this.isPgConnected && this.pgClient) {
      const query = `
        UPDATE users
        SET email = $1, username = $2, full_name = $3, password = $4, avatar_url = $5, bio = $6, role = $7, updated_at = $8
        WHERE id = $9
        RETURNING *;
      `;
      const values = [
        updatedUser.email,
        updatedUser.username,
        updatedUser.fullName,
        updatedUser.password,
        updatedUser.avatarUrl,
        updatedUser.bio,
        updatedUser.role,
        updatedUser.updatedAt,
        id,
      ];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToUser(res.rows[0]);
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`DELETE FROM users WHERE id = $1`, [id]);
      return true;
    }

    return this.users.delete(id);
  }

  async clear(): Promise<void> {
    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`DELETE FROM users`);
      return;
    }
    this.users.clear();
  }

  private mapRowToUser(row: any): User {
    return new User({
      id: row.id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      password: row.password,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
