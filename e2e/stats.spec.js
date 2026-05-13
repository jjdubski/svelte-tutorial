import { test, expect } from '@playwright/test';

test.describe('Stats Page — Completion Rate & Category Breakdown', () => {
	test.describe('Completion rate includes archived todos (Item 6)', () => {
		test('shows 0% when no tasks exist', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
			});
			await page.goto('/stats');
			await expect(page.locator('h2')).toHaveText('Analytics');
			// Should show 0% completion rate (both Completed and Active show 0%)
			await expect(page.getByText('Completed:')).toContainText('0%');
		});

		test('shows combined rate from active and archived todos', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				// 2 active todos: 1 completed, 1 incomplete
				// 1 archived todo: completed
				// Combined: 2 of 3 completed ≈ 67%
				// store.stats (active only): {completed: 1, active: 1, total: 2}
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 's1',
							title: 'Active done',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						},
						{
							id: 's2',
							title: 'Active incomplete',
							completed: false,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 's3',
							title: 'Archived done',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h2')).toHaveText('Analytics');
			// Wait for the stats page to render with the rate
			await expect(page.locator('h3', { hasText: 'Completion Rate' })).toBeVisible();
			// Combined: 2 completed out of 3 total = 67%
			await expect(page.getByText(/Completed:\s*67%/)).toBeVisible();
			// The "done" count reflects store.stats (active-only): 1 done
			await expect(page.getByText(/1 done/)).toBeVisible();
			// The "active" count shows active non-completed: 1 active
			await expect(page.getByText(/1 active/)).toBeVisible();
		});

		test('rate does not drop when archiving a completed task', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				// Active: 1 completed, 0 incomplete
				// Archived: 1 completed
				// Combined: 2 of 2 = 100%
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 's4',
							title: 'Only active task',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 's5',
							title: 'Archived completed',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Completion Rate' })).toBeVisible();
			// Should still be 100% since both are completed
			await expect(page.getByText(/Completed:\s*100%/)).toBeVisible();
		});

		test('rate adjusts downward when archiving an incomplete task', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				// Active: 1 completed, 0 incomplete → 100%
				// Archived: 1 incomplete
				// Combined: 1 of 2 = 50%
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 's6',
							title: 'Active done',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 's7',
							title: 'Archived incomplete',
							completed: false,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Completion Rate' })).toBeVisible();
			// Combined: 1 of 2 = 50%
			await expect(page.getByText(/Completed:\s*50%/)).toBeVisible();
		});

		test('handles only archived todos (no active)', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				localStorage.setItem('todos', JSON.stringify([]));
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 's8',
							title: 'Archived A',
							completed: true,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						},
						{
							id: 's9',
							title: 'Archived B',
							completed: false,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Completion Rate' })).toBeVisible();
			// 1 of 2 (archived) = 50% completion rate (includes archived)
			await expect(page.getByText(/Completed:\s*50%/)).toBeVisible();
			// store.stats only counts active todos, so "0 total tasks" is shown
			await expect(page.getByText(/0 total tasks/)).toBeVisible();
		});
	});

	test.describe('Category breakdown percentages (Item 7)', () => {
		test('shows "No categories assigned" when no categories exist', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 'c1',
							title: 'No category task',
							completed: false,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem('archivedTodos', JSON.stringify([]));
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Category Breakdown' })).toBeVisible();
			await expect(page.getByText('No categories assigned yet')).toBeVisible();
		});

		test('shows 100% for a single category across active and archived', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 'c2',
							title: 'Work task',
							completed: false,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 'c3',
							title: 'Archived work',
							completed: true,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Category Breakdown' })).toBeVisible();
			// Work should show 2 tasks and 100%
			const workRow = page.locator('text=Work').locator('..');
			await expect(workRow.getByText('2')).toBeVisible();
			await expect(workRow.getByText('(100%)')).toBeVisible();
		});

		test('percentages sum correctly across multiple categories', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				// Active: Work=2, Personal=1
				// Archived: Ideas=1
				// Combined: Work=2, Personal=1, Ideas=1 → total=4
				// Work: 50%, Personal: 25%, Ideas: 25% → sum=100
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 'c4',
							title: 'Work task 1',
							completed: false,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						},
						{
							id: 'c5',
							title: 'Work task 2',
							completed: true,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						},
						{
							id: 'c6',
							title: 'Personal task',
							completed: false,
							category: 'Personal',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 'c7',
							title: 'Archived idea',
							completed: true,
							category: 'Ideas',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Category Breakdown' })).toBeVisible();

			// Work: 2 tasks, 50%
			const workRow = page.locator('text=Work').locator('..');
			await expect(workRow.getByText('2')).toBeVisible();
			await expect(workRow.getByText('(50%)')).toBeVisible();

			// Personal: 1 task, 25%
			const personalRow = page.locator('text=Personal').locator('..');
			await expect(personalRow.getByText('1')).toBeVisible();
			await expect(personalRow.getByText('(25%)')).toBeVisible();

			// Ideas: 1 task, 25%
			const ideasRow = page.locator('text=Ideas').locator('..');
			await expect(ideasRow.getByText('1')).toBeVisible();
			await expect(ideasRow.getByText('(25%)')).toBeVisible();
		});

		test('archiving a task adjusts percentages but still sums to 100%', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				// Active: Work=2, Personal=2
				// Archived: Work=1
				// Combined: Work=3, Personal=2 → total=5
				// Work: 60%, Personal: 40% → sum=100
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 'c8',
							title: 'Work A',
							completed: false,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						},
						{
							id: 'c9',
							title: 'Work B',
							completed: true,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						},
						{
							id: 'c10',
							title: 'Personal A',
							completed: false,
							category: 'Personal',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						},
						{
							id: 'c11',
							title: 'Personal B',
							completed: false,
							category: 'Personal',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 'c12',
							title: 'Archived Work',
							completed: true,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Category Breakdown' })).toBeVisible();

			// Work: 3 tasks, 60%
			const workRow = page.locator('text=Work').locator('..');
			await expect(workRow.getByText('3')).toBeVisible();
			await expect(workRow.getByText('(60%)')).toBeVisible();

			// Personal: 2 tasks, 40%
			const personalRow = page.locator('text=Personal').locator('..');
			await expect(personalRow.getByText('2')).toBeVisible();
			await expect(personalRow.getByText('(40%)')).toBeVisible();
		});

		test('shows categories from archived todos only (no active categories)', async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.clear();
				localStorage.setItem('authMode', JSON.stringify('guest'));
				localStorage.setItem(
					'todos',
					JSON.stringify([
						{
							id: 'c13',
							title: 'No category',
							completed: false,
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z'
						}
					])
				);
				localStorage.setItem(
					'archivedTodos',
					JSON.stringify([
						{
							id: 'c14',
							title: 'Archived Work',
							completed: true,
							category: 'Work',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						},
						{
							id: 'c15',
							title: 'Archived Personal',
							completed: true,
							category: 'Personal',
							tags: [],
							createdAt: '2026-01-01T00:00:00.000Z',
							completedAt: '2026-01-01T12:00:00.000Z'
						}
					])
				);
			});
			await page.goto('/stats');
			await expect(page.locator('h3', { hasText: 'Category Breakdown' })).toBeVisible();

			// Work: 1 task, 50%
			const workRow = page.locator('text=Work').locator('..');
			await expect(workRow.getByText('1')).toBeVisible();
			await expect(workRow.getByText('(50%)')).toBeVisible();

			// Personal: 1 task, 50%
			const personalRow = page.locator('text=Personal').locator('..');
			await expect(personalRow.getByText('1')).toBeVisible();
			await expect(personalRow.getByText('(50%)')).toBeVisible();
		});
	});
});
