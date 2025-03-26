const request = require("supertest");
const app = require("../index"); // Now correctly imports Express app

beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
        name: "Existing User",
        email: "admin@example.com",
        password: "securepassword",
        role: "admin",
    });
});

describe("Auth API Endpoints", () => {
  it("should register a new user", async () => {
    const randomEmail = `test${Date.now()}@example.com`;
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: randomEmail,  // Unique email
      password: "password123",
      role: "user",
    });
    expect(res.statusCode).toEqual(201); // Change 200 to 201
    expect(res.body).toHaveProperty("token");
  });

  it("should login a user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "securepassword",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should deny access to protected route without token", async () => {
    const res = await request(app).get("/api/auth/protected");
    expect(res.statusCode).toEqual(401);
  });
});

// Ensure the app closes after tests
afterAll((done) => {
  done();
});