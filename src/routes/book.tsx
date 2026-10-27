import { createFileRoute } from "@tanstack/react-router";
import { BookPage } from "@/components/book-page";
import { artists, services } from "@/lib/studio";

type BookSearch = { artist?: string; service?: string };

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => {
    const artist =
      typeof search.artist === "string" && artists.some((item) => item.id === search.artist)
        ? search.artist
        : undefined;
    const service =
      typeof search.service === "string" && services.some((item) => item.id === search.service)
        ? search.service
        : undefined;
    return { artist, service };
  },
  component: function BookRoute() {
    const search = Route.useSearch();
    return <BookPage initialArtist={search.artist} initialService={search.service} />;
  },
});
