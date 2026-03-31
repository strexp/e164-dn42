describe("Database Coverage", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should throw if db is not initialized", () => {
    const { getDatabase, closeDatabase } = require("../db");
    closeDatabase();
    expect(() => getDatabase()).toThrow(
      "Database not initialized. Call initDatabase() first.",
    );
  });

  it("should initialize and return db successfully", () => {
    const { getDatabase, initDatabase } = require("../db");
    const db = initDatabase(":memory:");
    expect(getDatabase()).toBe(db);
    expect(db.open).toBe(true);
  });
});
