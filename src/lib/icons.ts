import {
  faMobileScreen,
  faUtensils,
  faCakeCandles,
  faCookie,
  faSeedling,
  faClapperboard,
  faSpa,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export const GIFT_ICONS: Record<string, IconDefinition> = {
  "mobile-screen": faMobileScreen,
  utensils: faUtensils,
  "cake-candles": faCakeCandles,
  cookie: faCookie,
  seedling: faSeedling,
  clapperboard: faClapperboard,
  spa: faSpa,
};

export function giftIcon(key: string): IconDefinition {
  return GIFT_ICONS[key] ?? faGift;
}
