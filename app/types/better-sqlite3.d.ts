declare module "better-sqlite3" {
    class Database {
      constructor(filename: string, options?: any);
      exec(sql: string): void;
      prepare(sql: string): Statement;
      transaction<T>(callback: () => T): T;
      pragma(sql: string): any;
    }
  
    class Statement {
      all(...params: any[]): any[];
      get(...params: any[]): any;
      run(...params: any[]): { changes: number; lastInsertRowid: number };
    }
  
    export default Database;
  }