import { A, LegalPage, P } from "../src/components/legal-page";

export default function TermsScreen() {
  return (
    <LegalPage title="Terms of service">
      <P>Last updated 8 October 2026.</P>
      <P>
        Collection is a personal library for the video games you own: which console, and whether a game is Finished. You can use it for that. Your list stays on this device. If the browser memory is cleared, the list is gone, and we cannot put it back.
      </P>
      <P>
        Search results, covers, screenshots, and game details come from IGDB (igdb.com). Those facts and pictures belong to IGDB. This app does not give you the right to copy the IGDB catalog and publish it as your own database.
      </P>
      <P>
        We use the IGDB API under the notes published at{" "}
        <A href="https://api-docs.igdb.com/#getting-started">Getting started</A>. The API is free. Non-commercial use follows the Twitch Developer Service Agreement. IGDB also offers a commercial partnership: a product that makes money with their data should write to partner@igdb.com. As part of that partnership they ask for a credit to IGDB.com that people can see, in a fixed place rather than a change log. This page is that place. Game information and images are from{" "}
        <A href="https://www.igdb.com">IGDB.com</A>.
      </P>
      <P>
        IGDB allows the data to be saved and shown by the app, and they prefer that, so the app is not asking them for the same picture on every visit. Covers of games in the library are kept on the device until the game is removed. Their limit is 4 requests per second. The app does not call IGDB from the browser. A small server does it, because a browser call would expose the login. IGDB says you may keep data already received if a partnership ends. We do not have that partnership: this is a personal library.
      </P>
      <P>
        The app is offered as it is. Game facts can be wrong or missing, because they come from IGDB.
      </P>
    </LegalPage>
  );
}
