import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';

export interface TrackingLink {
  id: string;
  alias: string;
  original_url: string;
  description?: string;
  created_at: string;
  expires_at?: string;
  click_count: number;
  is_active: boolean;
}

export interface Visitor {
  id: string;
  link_id: string;
  ip_address: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  user_agent?: string;
  visited_at: string;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // Initialize database file in data directory
    const dbPath = path.join(process.cwd(), 'data', 'tracking.db');
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    
    this.initializeTables();
  }

  private initializeTables() {
    // Create links table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        alias TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        click_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Create visitors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL,
        ip_address TEXT,
        latitude REAL,
        longitude REAL,
        country TEXT,
        city TEXT,
        device TEXT,
        browser TEXT,
        user_agent TEXT,
        visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (link_id) REFERENCES links (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_visitors_link_id ON visitors(link_id);
      CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON visitors(visited_at);
      CREATE INDEX IF NOT EXISTS idx_links_alias ON links(alias);
      CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
    `);
  }

  // Link management methods
  createLink(alias: string, originalUrl: string, description?: string, expiresAt?: Date): TrackingLink {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO links (id, alias, original_url, description, created_at, expires_at, click_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `);
    
    stmt.run(id, alias, originalUrl, description || null, now, expiresAt?.toISOString() || null);
    
    return {
      id,
      alias,
      original_url: originalUrl,
      description,
      created_at: now,
      expires_at: expiresAt?.toISOString(),
      click_count: 0,
      is_active: true
    };
  }

  getLinkByAlias(alias: string): TrackingLink | null {
    const stmt = this.db.prepare('SELECT * FROM links WHERE alias = ? AND is_active = 1');
    const result = stmt.get(alias) as any;
    
    if (!result) return null;
    
    return {
      ...result,
      is_active: Boolean(result.is_active)
    };
  }

  getLinkById(id: string): TrackingLink | null {
    const stmt = this.db.prepare('SELECT * FROM links WHERE id = ?');
    const result = stmt.get(id) as any;
    
    if (!result) return null;
    
    return {
      ...result,
      is_active: Boolean(result.is_active)
    };
  }

  getAllLinks(): TrackingLink[] {
    const stmt = this.db.prepare('SELECT * FROM links ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    
    return results.map(result => ({
      ...result,
      is_active: Boolean(result.is_active)
    }));
  }

  incrementClickCount(linkId: string): void {
    const stmt = this.db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?');
    stmt.run(linkId);
  }

  updateLink(id: string, updates: Partial<TrackingLink>): void {
    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    
    if (fields.length === 0) return;
    
    const stmt = this.db.prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values, id);
  }

  deleteLink(id: string): void {
    const stmt = this.db.prepare('UPDATE links SET is_active = 0 WHERE id = ?');
    stmt.run(id);
  }

  // Visitor tracking methods
  recordVisitor(linkId: string, visitorData: Omit<Visitor, 'id' | 'visited_at' | 'link_id'>): Visitor {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO visitors (
        id, link_id, ip_address, latitude, longitude, 
        country, city, device, browser, user_agent, visited_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      linkId,
      visitorData.ip_address,
      visitorData.latitude || null,
      visitorData.longitude || null,
      visitorData.country || null,
      visitorData.city || null,
      visitorData.device || null,
      visitorData.browser || null,
      visitorData.user_agent || null,
      now
    );
    
    return {
      id,
      link_id: linkId,
      visited_at: now,
      ...visitorData
    };
  }

  getVisitorsByLinkId(linkId: string): Visitor[] {
    const stmt = this.db.prepare('SELECT * FROM visitors WHERE link_id = ? ORDER BY visited_at DESC');
    return stmt.all(linkId) as Visitor[];
  }

  getAllVisitors(): Visitor[] {
    const stmt = this.db.prepare('SELECT * FROM visitors ORDER BY visited_at DESC');
    return stmt.all() as Visitor[];
  }

  getVisitorsByDateRange(startDate: Date, endDate: Date): Visitor[] {
    const stmt = this.db.prepare(`
      SELECT * FROM visitors 
      WHERE visited_at BETWEEN ? AND ? 
      ORDER BY visited_at DESC
    `);
    return stmt.all(startDate.toISOString(), endDate.toISOString()) as Visitor[];
  }

  // Analytics methods
  getClickStats(linkId?: string): {
    totalClicks: number;
    uniqueVisitors: number;
    countries: Array<{ country: string; count: number }>;
    recentVisits: Visitor[];
  } {
    let clicksQuery = 'SELECT COUNT(*) as total FROM visitors';
    let uniqueQuery = 'SELECT COUNT(DISTINCT ip_address) as unique FROM visitors';
    let countriesQuery = `
      SELECT country, COUNT(*) as count 
      FROM visitors 
      WHERE country IS NOT NULL
      GROUP BY country 
      ORDER BY count DESC
      LIMIT 10
    `;
    let recentQuery = 'SELECT * FROM visitors ORDER BY visited_at DESC LIMIT 10';
    
    const params: any[] = [];
    
    if (linkId) {
      clicksQuery += ' WHERE link_id = ?';
      uniqueQuery += ' WHERE link_id = ?';
      countriesQuery = countriesQuery.replace('FROM visitors', 'FROM visitors WHERE link_id = ?');
      recentQuery = recentQuery.replace('FROM visitors', 'FROM visitors WHERE link_id = ?');
      params.push(linkId, linkId, linkId, linkId);
    }
    
    const totalClicks = (this.db.prepare(clicksQuery).get(linkId) as any)?.total || 0;
    const uniqueVisitors = (this.db.prepare(uniqueQuery).get(linkId) as any)?.unique || 0;
    
    const countriesParams = linkId ? [linkId] : [];
    const countries = this.db.prepare(countriesQuery).all(...countriesParams) as Array<{ country: string; count: number }>;
    
    const recentParams = linkId ? [linkId] : [];
    const recentVisits = this.db.prepare(recentQuery).all(...recentParams) as Visitor[];
    
    return {
      totalClicks,
      uniqueVisitors,
      countries,
      recentVisits
    };
  }

  // Cleanup methods
  cleanupExpiredLinks(): void {
    const stmt = this.db.prepare('UPDATE links SET is_active = 0 WHERE expires_at < ? AND expires_at IS NOT NULL');
    stmt.run(new Date().toISOString());
  }

  // Database maintenance
  vacuum(): void {
    this.db.exec('VACUUM');
  }

  close(): void {
    this.db.close();
  }
}

// Singleton pattern for database instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export default DatabaseManager;