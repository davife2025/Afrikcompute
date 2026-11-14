-- FICTIONAL sample data so the app can be tried without real data. Run once, after migrations 0001 to 0004.
insert into profiles (near_account_id, role)
values ('demo-requester.testnet', 'requester')
on conflict (near_account_id) do nothing;

with r as (select id from profiles where near_account_id = 'demo-requester.testnet')
insert into requests (requester_id, title, description, language_code, task_type, domain, reward_amount, reward_token)
select r.id, v.title, v.description, v.lang, 'translate', v.domain, v.reward, 'USDT'
from r, (values
  ('Translate crop care tips into Hausa',          'Short farming advice sentences, translated from English.', 'ha', 'agriculture', 1.0),
  ('Translate crop care tips into Swahili',        'Short farming advice sentences, translated from English.', 'sw', 'agriculture', 1.0),
  ('Translate antenatal advice into Yoruba',       'Plain-language clinic advice for pregnant women.',         'yo', 'health',      1.0),
  ('Translate mobile money safety tips into Swahili', 'Safety advice for mobile money users.',                 'sw', 'finance',     0.5),
  ('Translate school attendance notices into Igbo', 'Short notices for parents and pupils.',                   'ig', 'education',   0.5),
  ('Translate local office notices into Hausa',    'Short notices about public services.',                     'ha', 'education',   0.5)
) as v(title, description, lang, domain, reward);

insert into tasks (request_id, payload)
select q.id, jsonb_build_object('text', v.src)
from requests q
join (values
  ('Translate crop care tips into Hausa',          'Check the maize leaves after the rain to see whether there are yellow spots.'),
  ('Translate crop care tips into Swahili',        'Remove weeds before they flower so they do not spread seeds.'),
  ('Translate antenatal advice into Yoruba',       'Pregnant women should go to the clinic for a check-up every month.'),
  ('Translate mobile money safety tips into Swahili', 'Keep your mobile money PIN secret and do not give it to anyone.'),
  ('Translate school attendance notices into Igbo', 'Children should go to school every day.'),
  ('Translate local office notices into Hausa',    'Bring your birth certificate when you register at the local government office.')
) as v(title, src) on v.title = q.title
where not exists (select 1 from tasks t where t.request_id = q.id);
