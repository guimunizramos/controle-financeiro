alter table public.configurations enable row level security;
alter table public.transactions enable row level security;
alter table public.installment_purchases enable row level security;

create policy "anon can select configurations"
on public.configurations
for select
to anon
using (true);

create policy "anon can insert configurations"
on public.configurations
for insert
to anon
with check (true);

create policy "anon can update configurations"
on public.configurations
for update
to anon
using (true)
with check (true);

create policy "anon can select transactions"
on public.transactions
for select
to anon
using (true);

create policy "anon can insert transactions"
on public.transactions
for insert
to anon
with check (true);

create policy "anon can update transactions"
on public.transactions
for update
to anon
using (true)
with check (true);

create policy "anon can delete transactions"
on public.transactions
for delete
to anon
using (true);

create policy "anon can select installment_purchases"
on public.installment_purchases
for select
to anon
using (true);

create policy "anon can insert installment_purchases"
on public.installment_purchases
for insert
to anon
with check (true);

create policy "anon can update installment_purchases"
on public.installment_purchases
for update
to anon
using (true)
with check (true);

create policy "anon can delete installment_purchases"
on public.installment_purchases
for delete
to anon
using (true);
