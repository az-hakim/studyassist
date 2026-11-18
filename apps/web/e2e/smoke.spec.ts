import { expect, test } from "@playwright/test";

test("landing page renders the product pitch", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/StudyAssistant/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/ai study assistant/i);
  await expect(page.getByRole("link", { name: /start learning free/i }).first()).toBeVisible();
});

test("sign-in screen offers Google, email and guest", async ({ page }) => {
  await page.goto("/#/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue as guest/i })).toBeVisible();
});

test("a guest can enter the workspace and see the dashboard", async ({ page }) => {
  await page.goto("/#/login");
  await page.getByRole("button", { name: /continue as guest/i }).click();
  await expect(page).toHaveURL(/#\/app/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/focused session/i);
  await expect(page.getByText(/your study spaces/i)).toBeVisible();
});
