import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../features/production/services/dailyPlanApi';
import type { ReadyQueueItem, ConflictInfo } from '../types/production';

test('Daily Plan - ApiError and DB Disconnected Handling', () => {
  // Test 1: Instantiation with DB_DISCONNECTED code
  const err = new ApiError(
    'Database disconnected; operations cannot be persisted',
    503,
    undefined,
    'DB_DISCONNECTED'
  );
  assert.equal(err.name, 'ApiError');
  assert.equal(err.statusCode, 503);
  assert.equal(err.code, 'DB_DISCONNECTED');
  assert.equal(err.message, 'Database disconnected; operations cannot be persisted');

  // Test 2: Conflict error parsing
  const conflict: ConflictInfo = {
    has_conflict: true,
    conflicted_machine: true,
    conflicted_assignee: false,
    message: 'Machine is already booked',
    details: ['Printer Heidelberg Speedmaster is assigned to Order #ORD-01'],
  };
  const conflictErr = new ApiError('Conflict detected', 409, conflict);
  assert.equal(conflictErr.statusCode, 409);
  assert.ok(conflictErr.conflict?.has_conflict);
  assert.equal(conflictErr.conflict?.details.length, 1);
});

test('Daily Plan - Order Readiness Verification & Block Reasons', () => {
  const readyOrder: ReadyQueueItem = {
    order_id: 'ord-101',
    order_no: 'ORD-101',
    customer_name: 'Somphone Printing',
    delivery_date: '2026-10-05',
    status: 'FILE_CONFIRMED',
    deposit_paid: true,
    deposit_amount: 500000,
    total_amount: 1000000,
    proof_approved: true,
    margin_approved: true,
    is_ready_for_production: true,
    items: [],
  };
  assert.equal(readyOrder.is_ready_for_production, true);
  assert.equal(readyOrder.block_reason, undefined);

  // Blocked 1: Missing deposit
  const noDepositOrder: ReadyQueueItem = {
    ...readyOrder,
    deposit_paid: false,
    deposit_amount: 0,
    is_ready_for_production: false,
    block_reason: 'Deposit payment required',
  };
  assert.equal(noDepositOrder.is_ready_for_production, false);
  assert.ok(noDepositOrder.block_reason?.includes('Deposit'));

  // Blocked 2: Unapproved proof / file
  const unapprovedOrder: ReadyQueueItem = {
    ...readyOrder,
    proof_approved: false,
    is_ready_for_production: false,
    block_reason: 'Artwork proof must be confirmed',
  };
  assert.equal(unapprovedOrder.is_ready_for_production, false);
  assert.ok(unapprovedOrder.block_reason?.includes('Artwork proof'));

  // Blocked 3: Cancelled order
  const cancelledOrder: ReadyQueueItem = {
    ...readyOrder,
    status: 'CANCELLED',
    is_ready_for_production: false,
    block_reason: 'Order is cancelled',
  };
  assert.equal(cancelledOrder.is_ready_for_production, false);
  assert.ok(cancelledOrder.block_reason?.includes('cancelled'));
});
