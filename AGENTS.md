# Collezione giochi

Vittorio è il designer di questo prodotto. Decide cosa fa l'app. Non è un programmatore e non scrive il codice: ogni spiegazione va data con quello che si vede e si tocca, mai con nomi di file, funzioni o comandi.

## Lingua

Parla in italiano, con parole da designer: schermate, flussi, etichette, raccolte. I termini del prodotto sono in [CONTEXT.md](CONTEXT.md).

Le scritte dentro l'app sono in inglese: Skip, Continue, Add a game, Settings, Wishes, Add systems, Edit systems, Finished, Currently playing, Complete, Remove from library. Con Vittorio citale così, e spiegale in italiano.

Un termine nuovo si propone in italiano semplice. Entra nel glossario solo dopo la sua conferma.

Una scelta si spiega così: cosa compare a schermo, cosa si sceglie, cosa resta in collezione.

## Il prodotto

Un'app per tenere la collezione dei videogiochi posseduti: su quale piattaforma e se è finito (Finished). Fisico o digitale è stato tolto per scelta di Vittorio: non va reintrodotto. Gira come sito web (anche installabile sul telefono a schermo intero) e come app Expo. Codice: Expo + expo-router, React Native Web, NativeWind, Zustand, TanStack Query.

Schermate (cartella `app/`):

- **Home** (`index.tsx`): una riga per piattaforma attiva, con le copertine che scorrono di lato. Una riga si fa scorrere per spegnere la piattaforma (con conferma; Cancel la rimette a posto). Edit systems porta a Systems.
- **Scaffale** (`shelf/[platformId].tsx`): i giochi di una piattaforma, a griglia o a lista, con Add a game in basso.
- **Scheda del gioco** (`game/[gameId]/[platformId].tsx`) e **Add a game → conferma** (`add/confirm.tsx`) hanno lo stesso aspetto (`src/components/game-sheet.tsx`): screenshot largo in alto che sfuma con il dither, informazioni a sinistra, copertina a destra. Nella conferma sotto c'è solo Add game. La scheda non ha barra in alto: Back a sinistra e un tasto a tre quadratini a destra galleggiano sullo screenshot; il tasto apre un menu dal basso con Currently playing e Complete (si escludono a vicenda) e Remove from library, che chiede conferma con la stessa finestra usata per spegnere una piattaforma (`ConfirmDialog`). Cambiare l'aspetto di una delle due schermate cambia anche l'altra. Nelle informazioni c'è Platforms con tutte le console su cui il gioco è uscito, poi la descrizione (About) e, solo per i giochi in libreria, Featured games: fino a 6 titoli simili della stessa console presi da IGDB, che aprono la loro scheda. Un gioco non in libreria aperto da lì non mostra Featured games né il menu, ma il tasto rosso Add to library. Sul sito la scheda non rimbalza in cima (su iPhone uno zoom agganciato non si riesce a sincronizzare); nell'app vera, tirando verso il basso, lo screenshot si allunga restando attaccato in alto.
- **Immagini**: copertina e screenshot dei giochi in libreria si salvano sul dispositivo e si scaricano una volta sola; si cancellano quando il gioco esce dalla libreria. Quelle dei giochi non in libreria restano solo temporanee e non si salvano.
- **Add a game** (`add/index.tsx` ricerca, `add/platform.tsx` scelta piattaforma): ricerca nel catalogo; i giochi con lo stesso titolo compaiono una volta sola, preferendo quello già in collezione.
- **Systems** (`platforms.tsx`), **Settings** (`settings.tsx`), **Wishes** (`wishes.tsx`).

Stile: carta a righe, inchiostro nero, rosso per le azioni, ombre nette spostate. Colori e caratteri in `src/theme.ts`: titoli in Anton (sempre maiuscolo), testi piccoli in Menlo. Le dissolvenze sono sempre a dither (puntini), mai sfumature morbide: sono in `src/components/chrome.tsx`.

## Da dove arrivano i dati

- **La collezione** vive solo sul dispositivo (memoria del browser, chiave `collection-v2`). Ogni dispositivo ha la sua. Non va mai cancellata né azzerata, nemmeno per fare prove.
- **Il catalogo** per cercare i giochi è RAWG (chiave in `.env`).
- **Copertine, informazioni (sviluppatore, editore, anno, genere) e screenshot** arrivano da IGDB attraverso la **porta**: un piccolo server che custodisce le credenziali Twitch. In locale la porta gira dentro il server di sviluppo (`server/covers-middleware.js`); online è un worker Cloudflare (`server/worker.ts`, `wrangler.toml`, indirizzo in `src/door.ts`). Quando cambi `src/igdb.ts` o la porta, riavvia il server di sviluppo e aggiorna subito anche la porta pubblica con `npx wrangler deploy`, in automatico: Vittorio non vuole che glielo si chieda.
- Le credenziali (`.env`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) non si stampano mai e non entrano mai nel sito pubblicato.

## Provare l'app

Server di sviluppo: `npx expo start --web --port 8081`, poi il browser di Cursor su `http://localhost:8081`. In locale e dentro Cursor l'app non va a schermo intero; sui telefoni veri sì.

## Pubblicare

Commit e push solo quando Vittorio lo chiede. La cartella `.cursor/` non si committa mai.

Sito pubblico su GitHub Pages: https://brakoh.github.io/games-tracker/. Ricetta:

1. Aggiungi per un momento `expo.experiments.baseUrl: "/games-tracker"` in `app.json`.
2. `npx expo export --platform web --output-dir dist`, poi `git checkout app.json` (il `baseUrl` non deve mai restare).
3. Controlla che in `dist` non ci siano credenziali.
4. In un worktree di `origin/gh-pages`: copia `dist`, aggiungi `404.html` (copia di `index.html`) e `.nojekyll`, committa e `git push origin HEAD:gh-pages`.

## Figma

File di riferimento: https://www.figma.com/design/eakdINgtjlOxETtujW86rb, pagina "Page 1", una schermata accanto all'altra. Prima di usare gli strumenti Figma leggi le skill `figma-use` e `figma-generate-design`.

Ogni schermata esportata su Figma deve essere **identica** a quella dell'app: stessi elementi, spaziature, immagini, colori e **stessi caratteri**. Il lavoro è finito solo quando tutte queste cose sono vere:

- La copia parte dalla schermata vera, aperta nel browser di Cursor e catturata con `generate_figma_design`, con le immagini già caricate.
- Ogni testo usa in Figma lo stesso carattere che l'app mostra davvero. La cattura rinomina Anton in `Anton_400Regular`: va rimesso su `Anton / Regular`, con maiuscolo dove l'app lo usa.
- Lo screenshot della schermata in Figma, messo accanto a quello del browser, non mostra differenze.

Limite noto: **Menlo non esiste in Figma**. Se un carattere non c'è, non sostituirlo in silenzio: dillo a Vittorio e fatti dire come procedere. Le schermate già nel file usano Geist Mono al posto di Menlo.
