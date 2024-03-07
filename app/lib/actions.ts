'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Type definition
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Type definition
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// CREATE
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  // Create a new date with the format "YYYY-MM-DD"
  const date = new Date().toISOString().split('T')[0];

  // SQL query to insert the new invoice into your database and pass in the variables
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // Since you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server.
  // You can do this with the revalidatePath function from Next.js.
  revalidatePath('/dashboard/invoices');

  // At this point, you also want to redirect the user back to the /dashboard/invoices page.
  // You can do this with the redirect function from Next.js
  redirect('/dashboard/invoices');
}

// Type definition
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// UPDATE
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// DELETE
export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
