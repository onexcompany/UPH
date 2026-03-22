'use server';

import { revalidatePath } from 'next/cache';

import { parseFormData, memberSchema, paymentSchema, expenseSchema, donationSchema, settingSchema, memberStatusSchema } from '@/lib/validations';
import {
  createDonation,
  createExpense,
  createMemberWithCharges,
  deleteDonation,
  deleteExpense,
  recordPayment,
  setMemberStatus,
  updateSettings,
} from '@/lib/services';

function revalidateAll() {
  ['/','/members','/payments','/expenses','/donations','/cash-flow','/settings'].forEach(revalidatePath);
}

export async function createMemberAction(formData: FormData) {
  const values = parseFormData(memberSchema, formData);
  await createMemberWithCharges(values.name);
  revalidateAll();
}

export async function updateSettingsAction(formData: FormData) {
  const values = parseFormData(settingSchema, formData);
  await updateSettings(values);
  revalidateAll();
}

export async function recordPaymentAction(formData: FormData) {
  const values = parseFormData(paymentSchema, formData);
  await recordPayment(values);
  revalidateAll();
}

export async function createExpenseAction(formData: FormData) {
  const values = parseFormData(expenseSchema, formData);
  await createExpense(values);
  revalidateAll();
}

export async function deleteExpenseAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteExpense(id);
  revalidateAll();
}

export async function createDonationAction(formData: FormData) {
  const values = parseFormData(donationSchema, formData);
  await createDonation(values);
  revalidateAll();
}

export async function deleteDonationAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteDonation(id);
  revalidateAll();
}

export async function updateMemberStatusAction(formData: FormData) {
  const values = parseFormData(memberStatusSchema, formData);
  await setMemberStatus(values.memberId, values.active);
  revalidateAll();
}
