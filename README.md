# EL-MOTO

Spletna stran za prodajo in najem motornih koles. Javni del je v slovenščini. Administracija omogoča vnos motorjev, fotografij, najema, povpraševanj in vsebin.

Lokalno teče na [http://localhost:3000](http://localhost:3000).

## Lokalni zagon

Potrebujete Node.js 20 ali novejši.

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Odprite http://localhost:3000.

Administracija: http://localhost:3000/admin

Začetni podatki za lokalno prijavo so v datoteki `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Pred objavo geslo zamenjajte.

## Baza

Lokalno se uporablja SQLite prek Prisme, ker na tem računalniku ni nameščen PostgreSQL. Shema je v `prisma/schema.prisma`.

Za produkcijo z PostgreSQL:

1. V `prisma/schema.prisma` nastavite `provider = "postgresql"`.
2. `DATABASE_URL` nastavite na povezavo PostgreSQL.
3. Zaženite `npx prisma migrate dev --name init` in `npx prisma db seed`.

Varnostna kopija: redno shranite datoteko SQLite ali naredite `pg_dump` produkcijske baze. Kopijo hranite izven strežnika.

## E-pošta

Povpraševanje se vedno shrani v bazo. E-pošta se pošlje samo, če je nastavljen Resend (`RESEND_API_KEY`) ali SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). Prejemnik obvestil je `NOTIFY_EMAIL` oziroma nastavitev v administraciji.

## Fotografije

Nalaganje shranjuje datoteke v `public/uploads`. Na strežniku mora biti ta mapa obstojna. Pred javno objavo lahko shrambo prestavite na objektno shrambo; v kodi je preverjanje vrste datoteke (JPG, PNG, WEBP) in velikosti do 8 MB.

Javne objave z Instagram profila so zapisane v `data/instagram-posts.json`, fotografije pa v `public/images/instagram/`. Nov zapis dodate tako, da fotografijo shranite v to mapo, dopolnite JSON z besedilom objave in zaženete `npm run import:instagram`. Uvoz ne prijavi se na Instagram in ne obide omejitev. Ponovni zagon osveži samo motorje iz te datoteke.

## Objava na elmoto.si

DNS zapisov in trenutne strani ne spreminjajte brez izrecnega dovoljenja.

1. Aplikacijo postavite na Node gostovanje ali Vercel.
2. Vključite HTTPS pri ponudniku.
3. Nastavite spremenljivke iz `.env.example`.
4. `NEXT_PUBLIC_SITE_URL` nastavite na `https://www.elmoto.si`.
5. Povežite PostgreSQL, zaženite migracije in seed administratorja.
6. Zamenjajte skrbniško geslo.
7. Nastavite e-pošto.
8. V administraciji potrdite pravna besedila, delovni čas in cenike.
9. Uvozite preverjene motorje in njihove fotografije.
10. Šele nato preusmerite domeno na novo strežbo.

## Preverjanje

```bash
npm test
npm run build
```

## Česa stran ne počne

- Ne prikazuje izmišljenih motorjev, cen ali ocen.
- Ne izvaja spletnega plačila.
- Povpraševanje za najem ni potrjena rezervacija.
- Analitika ni vklopljena.
