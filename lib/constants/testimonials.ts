export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "ashley-james",
    quote:
      "TailoredIQ gives you something most decision-makers don't have enough of: access to people who've already faced the problem you're trying to solve. The guidance is practical, contextual, and gives you much more confidence in your next move.",
    name: "Ashley James",
    role: "CEO, Cosmos",
  },
  {
    id: "amara-okoye",
    quote:
      "The real value is knowing that the guidance is grounded in experience. TailoredIQ doesn't just tell you what you could do—it helps you understand what makes sense for your specific situation.",
    name: "Amara Okoye",
    role: "Executive Director",
  },
  {
    id: "daniel-mensah",
    quote:
      "TailoredIQ helped us move from a complex problem to a clear path forward. The combination of structured thinking and real-world experience made the recommendations far more useful than a typical research report.",
    name: "Daniel Mensah",
    role: "COO",
  },
];
