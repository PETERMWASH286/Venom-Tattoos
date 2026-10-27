export type PassMethod = "card" | "paypal" | "usdt";

export type IssuedPass = {
  code: string;
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  artistId: string;
  date: string;
  time: string;
  deposit: number;
  method: PassMethod;
  live: boolean;
  placement: string;
  idea: string;
};
