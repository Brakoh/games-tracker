import { A, LegalPage, P } from "../src/components/legal-page";

export default function PrivacyScreen() {
  return (
    <LegalPage title="Privacy policy">
      <P>Last updated 8 October 2026.</P>
      <P>
        Collection keeps your game library on this device. There is no account. The list of games, the consoles you turned on, Finished, and Wishes stay in the memory of the browser or the app. They are not sent to us, and we do not sell them.
      </P>
      <P>
        When you search for a game, the words you type are sent to RAWG so the catalog can answer. RAWG is a separate service (rawg.io). We do not add your name to that search.
      </P>
      <P>
        Covers, screenshots, and the details on a game — developer, publisher, year, genre, and similar games — come from IGDB (igdb.com). The app does not talk to IGDB from the page itself. IGDB does not allow that, because a request from the browser would expose the login. A small server asks IGDB for us and sends back only the game information. That server does not receive your library.
      </P>
      <P>
        IGDB’s API is free for non-commercial use under the Twitch Developer Service Agreement. Their own notes are at{" "}
        <A href="https://api-docs.igdb.com/#getting-started">api-docs.igdb.com</A>. They allow, and prefer, that an app save the data and show it itself. Covers and screenshots of games in your library are saved on this device and downloaded once. They are deleted when the game leaves the library. Pictures of games you only open to look at are kept for the moment and are not saved.
      </P>
      <P>
        IGDB asks for a visible credit in a fixed place. Game information and images are from{" "}
        <A href="https://www.igdb.com">IGDB.com</A>. A commercial product that uses the same API needs a partnership with IGDB (partner@igdb.com). This app is a personal library, not that partnership.
      </P>
      <P>
        Clearing the site data, or removing the app, deletes the library on this device. We cannot restore it. The public site is a static page: the host can see an ordinary visit, such as an address and a browser, the way any website can. We do not add our own tracking on top of that.
      </P>
    </LegalPage>
  );
}
