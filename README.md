# CarZone România — magazin cu Supabase

Proiect pregătit pentru conectarea la un proiect Supabase.

## 1. Creează baza de date
În Supabase → SQL Editor rulează `supabase/schema.sql`.

## 2. Configurează frontend-ul
În `config.js` completează:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Cheia ANON este publicabilă în frontend. NU pune niciodată `service_role` în HTML/JS.

## 3. Admin
Deschide `admin/index.html` după ce creezi un utilizator în Supabase Auth.
Adminul permite:
- adăugare produse
- modificare preț/stoc
- activare/dezactivare produse
- vizualizare comenzi
- schimbare status comandă

Pentru producție, accesul admin trebuie limitat prin RLS/politici și conturile autorizate.

## 4. Plăți cu cardul
Structura comenzii este pregătită pentru integrare cu un procesator de plăți. Plata reală NU poate fi activată doar din HTML: sunt necesare credențiale de comerciant și un endpoint server-side/webhook al procesatorului.

## 5. Curier
Integrarea AWB se face separat, după alegerea furnizorului de curierat și obținerea credentialelor API.
