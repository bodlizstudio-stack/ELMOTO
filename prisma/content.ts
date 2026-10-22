import { site } from "../src/lib/site";

export const faqs = [
  ["Nakup", "Kako lahko rezerviram ogled motorja?", "Ogled uredite po dogovoru. Pošljite povpraševanje na strani motorja ali pokličite +386 70 868 600. Oddaja obrazca še ne pomeni, da je termin potrjen.", 1],
  ["Nakup", "Ali je možen ogled po dogovoru?", "Da. Ogled je mogoč po predhodnem dogovoru na naslovu Špruha 33, 1236 Trzin.", 2],
  ["Nakup", "Kako pridobim informacije o stanju motorja?", "V oglasu so podatki, ki jih je podjetje vneslo za to vozilo. Servisna zgodovina je objavljena samo, kadar je dokumentirana. Za dodatna pojasnila pošljite povpraševanje.", 3],
  ["Nakup", "Kako poteka nakup?", "Pregledate ponudbo, izberete motor, pošljete povpraševanje in se dogovorite za ogled. Nakup in prevzem uredite neposredno z EL-MOTO. Spletna stran ne izvede plačila.", 4],
  ["Najem", "Kako pošljem povpraševanje za najem?", "Na strani Najem izberite motor, vnesite datum in uro prevzema ter vračila, svoje podatke in pošljite obrazec.", 1],
  ["Najem", "Kdaj je rezervacija potrjena?", "Šele ko EL-MOTO povpraševanje pregleda in ga potrdi. Oddaja obrazca je povpraševanje, ne samodejna rezervacija.", 2],
  ["Najem", "Katere pogoje moram izpolnjevati?", "Pogoje določi podjetje. Dokler pogoji najema na strani niso potrjeni, ne veljajo kot uradni dokument. Pred najemom vas EL-MOTO seznani z veljavnimi pogoji.", 3],
  ["Najem", "Kako potekata prevzem in vračilo?", "Praviloma na naslovu Špruha 33, 1236 Trzin, ob dogovorjenem času. Točen postopek potrdi podjetje ob rezervaciji.", 4],
  ["Najem", "Ali je potrebna varščina?", "Varščina je navedena samo, če je pri motorju vnesena in potrjena. Če znesek ni objavljen, se dogovori individualno.", 5],
  ["Najem", "Kakšni so pogoji odpovedi?", "Veljajo potrjeni pogoji najema. Dokler niso potrjeni, se odpoved uredi neposredno z EL-MOTO.", 6],
  ["Splošno", "Kje se nahaja EL-MOTO?", "Špruha 33, 1236 Trzin, Slovenija.", 1],
  ["Splošno", "Kako kontaktiram prodajalca?", "Pokličite +386 70 868 600, pišite na info@elmoto.si ali uporabite kontaktni obrazec.", 2],
  ["Splošno", "Kje lahko spremljam novo ponudbo?", "Na tej spletni strani in na Instagramu @elmoto.si. E-poštna obvestila so na voljo šele, ko je prijava vključena in podate soglasje.", 3],
] as const;

const draft = "OSNUTEK. Besedilo mora pred objavo pregledati odgovorna oseba EL-MOTO. Do potrditve v administraciji ne velja kot uradni dokument.\n\n";

export const pages = [
  {
    slug: "zasebnost",
    title: "Politika zasebnosti",
    seoTitle: "Politika zasebnosti",
    seoDescription: "Kako EL-MOTO obdeluje podatke iz obrazcev.",
    body: `${draft}Upravljavec: ${site.registryName}, ${site.street}, ${site.postalCode} ${site.city}, ${site.email}, ${site.phoneDisplay}.

Katere podatke zbiramo
Ob oddaji kontaktnega obrazca ali povpraševanja za najem shranimo ime in priimek, e-pošto, telefon, če ga vnesete, vsebino sporočila, izbrani motor in podatke o terminu najema. Ne zahtevamo kopij dokumentov.

Zakaj jih obdelujemo
Podatke uporabimo za odgovor na povpraševanje, dogovor o ogledu, nakupu ali najemu in za evidenco komunikacije. Pravna podlaga je izvedba postopkov pred pogodbo oziroma zakoniti interes za odgovor na vaše sporočilo.

Hramba
Povpraševanja hranimo, dokler je to potrebno za odgovor in morebitno pogodbo, nato pa jih izbrišemo ali anonimiziramo, razen če daljše hranjenje zahteva zakon.

Prejemniki
Podatki so dostopni pooblaščenim osebam EL-MOTO. E-pošta se pošlje prek nastavljenega poštnega servisa, če je ta vklopljen. Podatkov ne prodajamo.

Vaše pravice
Zahtevate lahko dostop, popravek, izbris, omejitev ali prenos podatkov in ugovarjate obdelavi. Zahtevo pošljite na ${site.email}. Pritožbo lahko vložite pri Informacijskem pooblaščencu.

Primerjava motorjev je shranjena samo v vašem brskalniku.`,
  },
  {
    slug: "piskotki",
    title: "Politika piškotkov",
    seoTitle: "Politika piškotkov",
    seoDescription: "Katere zapise v brskalniku uporablja EL-MOTO.",
    body: `${draft}Stran uporablja nujni sejni piškotek samo za prijavo administratorja. Obiskovalci lahko v brskalniku shranijo izbiro o piškotkih in primerjavo motorjev. To ostane v vaši napravi.

Analitični in marketinški piškotki niso nameščeni. Če bodo kdaj na voljo, se ne bodo vklopili pred vašo izbiro.

Izbira se lahko kadarkoli spremeni prek povezave Nastavitve piškotkov v nogi strani.`,
  },
  {
    slug: "pogoji",
    title: "Splošni pogoji poslovanja",
    seoTitle: "Splošni pogoji poslovanja",
    seoDescription: "Osnutek pogojev nakupa motorja pri EL-MOTO.",
    body: `${draft}Podjetje: ${site.brand}, ${site.street}, ${site.postalCode} ${site.city}.

Spletna stran predstavlja ponudbo motornih koles. Objavljeni podatki veljajo, kot so vneseni v posameznem oglasu. Cena je zavezujoče prikazana samo, kadar je označena kot potrjena. Sicer je cena na povpraševanje.

Povpraševanje, ogled in nakup se uredijo neposredno s podjetjem. Oddaja obrazca ni sklenitev pogodbe in ni rezervacija, dokler je EL-MOTO ne potrdi.

Spletno plačilo ni na voljo. Način plačila, prevzem in morebitna garancija se dogovorijo posebej in samo, če so izrecno potrjeni.

Podatki o vozilu se lahko spremenijo do sklenitve dogovora. Prodano vozilo ni več na voljo za nakup.`,
  },
  {
    slug: "pogoji-najema",
    title: "Pogoji najema",
    seoTitle: "Pogoji najema",
    seoDescription: "Osnutek pogojev najema motorja pri EL-MOTO.",
    body: `${draft}Ti pogoji opisujejo okvir najema in postanejo uradni šele, ko jih odgovorna oseba potrdi v administraciji.

Prevzem in vračilo
Praviloma na naslovu ${site.street}, ${site.postalCode} ${site.city}, ob dogovorjenem datumu in uri. Motor se prevzame in vrne v dogovorjenem stanju.

Vozniško dovoljenje
Najemnik mora imeti veljavno dovoljenje za kategorijo, ki jo zahteva izbrani motor. Kategorija je na strani navedena samo, kadar je vpisana pri vozilu.

Odgovornost in zavarovanje
Obseg zavarovanja, soudeležba in odgovornost za škodo se določijo v potrjenih pogojih oziroma ob potrditvi rezervacije. Do takrat jih stran ne določa.

Varščina
Znesek varščine je objavljen samo, če je pri motorju vnesen in potrjen. Sicer se dogovori individualno.

Cena
Dnevna, vikend, večdnevna in sezonska cena, omejitev kilometrov ter doplačilo za dodatne kilometre se pokažejo samo iz potrjenega cenika. Brez potrjenega cenika je cena na povpraševanje.

Odpoved
Roki in morebitni stroški odpovedi se uredijo v potrjenih pogojih. Do potrditve se odpoved dogovori neposredno z EL-MOTO.

Potrditev
Oddaja obrazca ni potrjena rezervacija in ni plačilo. Rezervacija velja, ko jo EL-MOTO potrdi.`,
  },
  {
    slug: "podjetje",
    title: "Podatki o podjetju",
    seoTitle: "Podatki o podjetju",
    seoDescription: "EL-MOTO, Špruha 33, 1236 Trzin.",
    body: `${draft}Blagovna znamka: ${site.brand}
Navedeno ime: ${site.legalName}
Naziv v javnem registru, ki ga je treba potrditi: ${site.registryName}
Naslov: ${site.street}, ${site.postalCode} ${site.city}, ${site.country}
Telefon: ${site.phoneDisplay}
E-pošta: ${site.email}
Instagram: ${site.instagram}

Javno dostopni podatki, ki jih je pred objavo treba preveriti:
Davčna številka: ${site.taxNumber}
Matična številka: ${site.registrationNumber}
Zastopnik: ${site.representative}
Vpis: ${site.registeredOn}, ${site.court}

Dejavnost: trgovina na drobno z motornimi kolesi ter deli in opremo zanje.`,
  },
];
