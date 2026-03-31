import { authMiddleware } from "../middleware/auth";
import { registryMiddleware } from "../middleware/registry";

jest.mock("../config", () => ({
  getConfig: () => ({ server: { jwtSecret: "secret" } }),
}));

describe("Middleware Coverage", () => {
  describe("authMiddleware", () => {
    it("should return 401 if no auth header", () => {
      const req: any = { headers: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 401 if token is invalid", () => {
      const req: any = { headers: { authorization: "Bearer invalid" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });
  });

  describe("registryMiddleware", () => {
    it("should return 401 if user not in req", () => {
      const req: any = {};
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      registryMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
  });
});
