import { z } from "zod";

// HTML form input'larında boş bırakılan opsiyonel alanlar "" olarak gelir (undefined değil).
// z.coerce.number() "" değerini 0'a çevirir, bu da .positive() gibi kuralları haksız yere
// tetikler. Bu yardımcı, boş string'i undefined'a çevirip ardından iç şemayı opsiyonel yapar.
export function optionalCoerced<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((value) => (value === "" || value === null ? undefined : value), inner.optional());
}
