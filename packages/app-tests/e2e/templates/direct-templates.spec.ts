import { expect, test } from '@playwright/test';

import { WEBAPP_BASE_URL } from '@documenso/lib/constants/app';
import {
  DIRECT_TEMPLATE_RECIPIENT_EMAIL,
  DIRECT_TEMPLATE_RECIPIENT_NAME,
} from '@documenso/lib/constants/template';
import { createDocumentAuthOptions } from '@documenso/lib/utils/document-auth';
import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { formatDirectTemplatePath } from '@documenso/lib/utils/templates';
import { seedTeam, unseedTeam } from '@documenso/prisma/seed/teams';
import { seedDirectTemplate, seedTemplate } from '@documenso/prisma/seed/templates';
import { seedTestEmail, seedUser, unseedUser } from '@documenso/prisma/seed/users';

import { apiSignin, apiSignout } from '../fixtures/authentication';
import { checkDocumentTabCount } from '../fixtures/documents';

test.describe.configure({ mode: 'parallel' });

test('[DIRECT_TEMPLATES]: create direct link for template', async ({ page }) => {
  const team = await seedTeam({
    createTeamMembers: 1,
  });

  const owner = team.owner;

  // Should only be visible to the owner in personal templates.
  await seedTemplate({
    title: 'Personal template',
    userId: owner.id,
  });

  // Should be visible to team members.
  await seedTemplate({
    title: 'Team template 1',
    userId: owner.id,
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: owner.email,
    redirectPath: '/templates',
  });

  const urls = [`${WEBAPP_BASE_URL}/t/${team.url}/templates`, `${WEBAPP_BASE_URL}/templates`];

  // Run test for personal and team templates.
  for (const url of urls) {
    // Owner should see list of templates with no direct link badge.
    await page.goto(url);
    await expect(page.getByRole('button', { name: 'direct link' })).toBeHidden();

    // Create direct link.
    await page.getByRole('cell', { name: 'Use Template' }).getByRole('button').nth(1).click();
    await page.getByRole('menuitem', { name: 'Direct link' }).click();
    await page.getByRole('button', { name: 'Enable direct link signing' }).click();
    await page.getByRole('button', { name: 'Create one automatically' }).click();
    await expect(page.getByRole('heading', { name: 'Direct Link Signing' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Expect badge to appear.
    await expect(page.getByRole('button', { name: 'direct link' })).toBeVisible();
  }

  await unseedTeam(team.url);
});

test('[DIRECT_TEMPLATES]: toggle direct template link', async ({ page }) => {
  const team = await seedTeam({
    createTeamMembers: 1,
  });

  const owner = team.owner;

  // Should only be visible to the owner in personal templates.
  const personalDirectTemplate = await seedDirectTemplate({
    title: 'Personal direct template link',
    userId: owner.id,
  });

  // Should be visible to team members.
  const teamDirectTemplate = await seedDirectTemplate({
    title: 'Team direct template link 1',
    userId: owner.id,
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: owner.email,
  });

  // Run test for personal and team templates.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    // Check that the direct template link is accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();

    // Navigate to template settings and disable access.
    await page.goto(`${WEBAPP_BASE_URL}${formatTemplatesPath(template.team?.url)}`);
    await page.getByRole('cell', { name: 'Use Template' }).getByRole('button').nth(1).click();
    await page.getByRole('menuitem', { name: 'Direct link' }).click();
    await page.getByRole('switch').click();
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Direct link signing has been').first()).toBeVisible();
    await page.getByLabel('Direct Link Signing', { exact: true }).press('Escape');

    // Check that the direct template link is no longer accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByText('Template not found')).toBeVisible();
  }

  await unseedTeam(team.url);
});

test('[DIRECT_TEMPLATES]: delete direct template link', async ({ page }) => {
  const team = await seedTeam({
    createTeamMembers: 1,
  });

  const owner = team.owner;

  // Should only be visible to the owner in personal templates.
  const personalDirectTemplate = await seedDirectTemplate({
    title: 'Personal direct template link',
    userId: owner.id,
  });

  // Should be visible to team members.
  const teamDirectTemplate = await seedDirectTemplate({
    title: 'Team direct template link 1',
    userId: owner.id,
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: owner.email,
  });

  // Run test for personal and team templates.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    // Check that the direct template link is accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();

    // Navigate to template settings and delete the access.
    await page.goto(`${WEBAPP_BASE_URL}${formatTemplatesPath(template.team?.url)}`);
    await page.getByRole('cell', { name: 'Use Template' }).getByRole('button').nth(1).click();
    await page.getByRole('menuitem', { name: 'Direct link' }).click();
    await page.getByRole('button', { name: 'Remove direct linking' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Direct template link deleted').first()).toBeVisible();

    // Check that the direct template link is no longer accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByText('Template not found')).toBeVisible();
  }

  await unseedTeam(team.url);
});

test('[DIRECT_TEMPLATES]: direct template link auth access', async ({ page }) => {
  const user = await seedUser();

  const directTemplateWithAuth = await seedDirectTemplate({
    title: 'Personal direct template link',
    userId: user.id,
    createTemplateOptions: {
      authOptions: createDocumentAuthOptions({
        globalAccessAuth: 'ACCOUNT',
        globalActionAuth: null,
      }),
    },
  });

  const directTemplatePath = formatDirectTemplatePath(
    directTemplateWithAuth.directLink?.token || '',
  );

  await page.goto(directTemplatePath);

  await expect(page.getByText('Authentication required')).toBeVisible();

  await apiSignin({
    page,
    email: user.email,
  });

  await page.goto(directTemplatePath);

  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeDisabled();

  await unseedUser(user.id);
});

test('[DIRECT_TEMPLATES]: use direct template link with 1 recipient', async ({ page }) => {
  const team = await seedTeam({
    createTeamMembers: 1,
  });

  const owner = team.owner;

  // Should only be visible to the owner in personal templates.
  const personalDirectTemplate = await seedDirectTemplate({
    title: 'Personal direct template link',
    userId: owner.id,
  });

  // Should be visible to team members.
  const teamDirectTemplate = await seedDirectTemplate({
    title: 'Team direct template link 1',
    userId: owner.id,
    teamId: team.id,
  });

  // Run test for personal and team templates.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    // Check that the direct template link is accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();

    await page.getByPlaceholder('recipient@documenso.com').fill(seedTestEmail());

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Complete' }).click();
    await page.getByRole('button', { name: 'Sign' }).click();
    await page.waitForURL(/\/sign/);
    await expect(page.getByRole('heading', { name: 'Document Signed' })).toBeVisible();
  }

  await apiSignin({
    page,
    email: owner.email,
  });

  // Check that the owner has the documents.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    await page.goto(`${WEBAPP_BASE_URL}${formatDocumentsPath(template.team?.url)}`);

    // Check that the document is in the 'All' tab.
    await checkDocumentTabCount(page, 'Completed', 1);
  }

  await unseedTeam(team.url);
});

test('[DIRECT_TEMPLATES]: use direct template link with 2 recipients', async ({ page }) => {
  const team = await seedTeam({
    createTeamMembers: 1,
  });

  const owner = team.owner;

  const secondRecipient = await seedUser();

  const createTemplateOptions = {
    Recipient: {
      createMany: {
        data: [
          {
            email: DIRECT_TEMPLATE_RECIPIENT_EMAIL,
            name: DIRECT_TEMPLATE_RECIPIENT_NAME,
            token: Math.random().toString().slice(2, 7),
          },
          {
            email: secondRecipient.email,
            token: Math.random().toString().slice(1, 7),
          },
        ],
      },
    },
  };

  // Should only be visible to the owner in personal templates.
  const personalDirectTemplate = await seedDirectTemplate({
    title: 'Personal direct template link',
    userId: owner.id,
    createTemplateOptions,
  });

  // Should be visible to team members.
  const teamDirectTemplate = await seedDirectTemplate({
    title: 'Team direct template link 1',
    userId: owner.id,
    teamId: team.id,
    createTemplateOptions,
  });

  // Run test for personal and team templates.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    // Check that the direct template link is accessible.
    await page.goto(formatDirectTemplatePath(template.directLink?.token || ''));
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();

    await page.getByPlaceholder('recipient@documenso.com').fill(seedTestEmail());

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Complete' }).click();
    await page.getByRole('button', { name: 'Sign' }).click();
    await page.waitForURL(/\/sign/);
    await expect(page.getByText('Waiting for others to sign')).toBeVisible();
  }

  await apiSignin({
    page,
    email: owner.email,
  });

  // Check that the owner has the documents.
  for (const template of [personalDirectTemplate, teamDirectTemplate]) {
    await page.goto(`${WEBAPP_BASE_URL}${formatDocumentsPath(template.team?.url)}`);

    // Check that the document is in the 'All' tab.
    await checkDocumentTabCount(page, 'All', 1);
    await checkDocumentTabCount(page, 'Pending', 1);
  }

  await apiSignout({ page });

  // Check that the second recipient has the 2 pending documents.
  await apiSignin({
    page,
    email: secondRecipient.email,
  });

  await page.goto('/documents');

  await checkDocumentTabCount(page, 'All', 2);
  await checkDocumentTabCount(page, 'Inbox', 2);

  await unseedTeam(team.url);
  await unseedUser(secondRecipient.id);
});
