import type { DatabaseColumn } from '@/features/projects/database/dataGrid/types/dataBrowser';
import { expect, test } from 'vitest';
import prepareCreateColumnQuery from './prepareCreateColumnQuery';

test('should prepare one query for a simple column', () => {
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'text', label: 'text' },
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
  });

  expect(transaction).toHaveLength(1);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column text NOT NULL;',
  );
});

test('should prepare a minimum of two queries for a column with a comment', () => {
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'text', label: 'text' },
    comment: 'test comment',
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
  });

  expect(transaction.length).toBeGreaterThanOrEqual(2);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column text NOT NULL;',
  );
  expect(transaction[1].args.sql).toBe(
    "COMMENT ON COLUMN public.test_table.test_column is 'test comment';",
  );
});

test('should not prepare an identity query if column is not of the right type', () => {
  // Note that `text` columns can't be identity columns.
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'text', label: 'text' },
    isIdentity: true,
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
  });

  expect(transaction.length).toBe(1);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column text NOT NULL;',
  );
});

test('should prepare a minimum of two queries for an identity column', () => {
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'int4', label: 'integer' },
    isIdentity: true,
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
  });

  expect(transaction.length).toBeGreaterThanOrEqual(2);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column int4 NOT NULL;',
  );
  expect(transaction[1].args.sql).toBe(
    'ALTER TABLE public.test_table ALTER COLUMN test_column ADD GENERATED BY DEFAULT AS IDENTITY;',
  );
});

test('should prepare a minimum of two queries for a column that has a foreign key relation', () => {
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'int4', label: 'integer' },
    foreignKeyRelation: {
      name: 'test_table_name_fkey',
      columnName: 'test_column',
      referencedSchema: 'public',
      referencedTable: 'test_table',
      referencedColumn: 'id',
      updateAction: 'RESTRICT',
      deleteAction: 'RESTRICT',
    },
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
  });

  expect(transaction.length).toBeGreaterThanOrEqual(2);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column int4 NOT NULL;',
  );
  expect(transaction[1].args.sql).toBe(
    'ALTER TABLE public.test_table ADD CONSTRAINT test_table_test_column_fkey FOREIGN KEY (test_column) REFERENCES public.test_table (id) ON UPDATE RESTRICT ON DELETE RESTRICT;',
  );
});

test(`should not prepare a query for the foreign key relation if generator is disabled`, () => {
  const column: DatabaseColumn = {
    name: 'test_column',
    type: { value: 'int4', label: 'integer' },
    foreignKeyRelation: {
      name: 'test_table_name_fkey',
      columnName: 'test_column',
      referencedSchema: 'public',
      referencedTable: 'test_table',
      referencedColumn: 'id',
      updateAction: 'RESTRICT',
      deleteAction: 'RESTRICT',
    },
  };

  const transaction = prepareCreateColumnQuery({
    dataSource: 'default',
    schema: 'public',
    table: 'test_table',
    column,
    enableForeignKeys: false,
  });

  expect(transaction).toHaveLength(1);
  expect(transaction[0].args.sql).toBe(
    'ALTER TABLE public.test_table ADD test_column int4 NOT NULL;',
  );
});
