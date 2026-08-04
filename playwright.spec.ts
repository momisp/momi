import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://yuanxing.wanxiayc.com/登录.html/';

test.use({ baseURL: BASE_URL });

async function clearSession(page: Page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function loginAsAdmin(page: Page) {
  await clearSession(page);
  await page.getByPlaceholder('请输入账号').fill('admin');
  await page.getByPlaceholder('请输入密码').fill('Admin123');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL(/母包列表\.html/, { timeout: 10000 });
}

test.describe('登录页', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('打开登录页展示品牌区与表单关键元素', async ({ page }) => {
    await expect(page).toHaveTitle(/登录 - 在线分包管理系统/);
    await expect(page.getByText('在线分包管理系统').first()).toBeVisible();
    await expect(page.getByText('高效便捷 · 智能管理 · 一键改包')).toBeVisible();
    await expect(page.getByText('欢迎登录')).toBeVisible();
    await expect(page.getByPlaceholder('请输入账号')).toHaveValue('admin');
    await expect(page.getByPlaceholder('请输入密码')).toHaveValue('Admin123');
    await expect(page.getByRole('checkbox', { name: '记住我' })).toBeChecked();
    await expect(page.getByText('默认账号：')).toBeVisible();
    await expect(page.getByText('账号: admin / 密码: Admin123')).toBeVisible();
  });

  test('账号或密码错误时登录失败并停留登录页', async ({ page }) => {
    await page.getByPlaceholder('请输入账号').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('WrongPass');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page.getByText('账号或密码错误')).toBeVisible();
    await expect(page.getByText('欢迎登录')).toBeVisible();
    await expect(page).not.toHaveURL(/母包列表\.html/);
  });

  test('使用默认演示账号登录成功跳转母包列表', async ({ page }) => {
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page.getByText('登录成功，正在跳转...')).toBeVisible();
    await page.waitForURL(/母包列表\.html/, { timeout: 10000 });
    await expect(page).toHaveTitle(/母包列表 - 在线分包管理系统/);
  });

  test('点击忘记密码打开重置密码弹窗', async ({ page }) => {
    await page.getByText('忘记密码？').click();

    await expect(page.getByText('重置密码').first()).toBeVisible();
    await expect(page.getByPlaceholder('请输入要重置密码的账号')).toBeVisible();
    await expect(page.getByPlaceholder('请输入新密码（至少8位）')).toBeVisible();
    await expect(page.getByRole('button', { name: '确认重置' })).toBeVisible();
  });
});

test.describe('主框架与业务页', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('登录后侧栏展示游戏管理等菜单分组', async ({ page }) => {
    await expect(page.getByText('分包管理')).toBeVisible();
    await expect(page.getByText('游戏管理')).toBeVisible();
    await expect(page.getByRole('link', { name: '母包列表' })).toBeVisible();
    await expect(page.getByRole('link', { name: '分包列表' })).toBeVisible();
    await expect(page.getByText('改包系统')).toBeVisible();
    await expect(page.getByText('渠道管理')).toBeVisible();
    await expect(page.getByText('系统管理')).toBeVisible();
  });

  test('侧栏点击分包列表可跳转', async ({ page }) => {
    await page.getByRole('link', { name: '分包列表' }).click();

    await page.waitForURL(/分包列表\.html/, { timeout: 10000 });
    await expect(page).toHaveTitle(/分包列表 - 在线分包管理系统/);
  });

  test('母包列表展示关键表头与数据行', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: '游戏名称' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '包名' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '系统类型' })).toBeVisible();
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible();
    await expect(page.getByText('传奇世界H5').first()).toBeVisible();
  });

  test('确认退出后回到登录页', async ({ page }) => {
    await page.locator('#userInfo').click();
    await page.getByText('退出登录').click();
    await expect(page.getByText('确定要退出登录吗？')).toBeVisible();
    await page.getByRole('button', { name: '确认退出' }).click();

    await page.waitForURL(/登录\.html/, { timeout: 10000 });
    await expect(page.getByText('欢迎登录')).toBeVisible();
  });
});
