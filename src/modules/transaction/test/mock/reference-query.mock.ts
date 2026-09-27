import { Result } from '@/shared/base/result';
import { AccountReferenceQuery, CategoryHierarchyQuery } from '@/modules/transaction';

export const acceptingAccountReference = (): AccountReferenceQuery => ({
  execute: jest.fn().mockResolvedValue(Result.ok()),
});

export const rejectingAccountReference = (code: string): AccountReferenceQuery => ({
  execute: jest.fn().mockResolvedValue(Result.fail(code)),
});

export const acceptingCategoryHierarchy = (): CategoryHierarchyQuery => ({
  execute: jest.fn().mockResolvedValue(Result.ok()),
});

export const rejectingCategoryHierarchy = (code: string): CategoryHierarchyQuery => ({
  execute: jest.fn().mockResolvedValue(Result.fail(code)),
});
