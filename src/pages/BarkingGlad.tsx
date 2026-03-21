import heroImage from "@/assets/barking-glad-hero.png";
import { Button } from "@/components/ui/button";
import { Dog, Heart, Clock, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

const BarkingGlad = () => {
  return (
    <div className="min-h-screen bg-[hsl(45,60%,97%)] text-[hsl(30,10%,20%)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[hsl(145,45%,42%)] text-white shadow-md">
        <div className="flex items-center gap-2">
          <Dog size={28} />
          <span className="text-xl font-bold tracking-tight">Barking Glad</span>
        </div>
        <div className="hidden sm:flex gap-6 text-sm font-medium">
          <a href="#about" className="hover:underline">About</a>
          <a href="#services" className="hover:underline">Services</a>
          <a href="#reviews" className="hover:underline">Reviews</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col lg:flex-row items-center gap-8 max-w-5xl mx-auto px-6 py-12">
        <div className="flex-1 space-y-5">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-[hsl(145,45%,30%)]">
            Your pup deserves the <span className="text-[hsl(30,80%,50%)]">best walks</span> in town
          </h1>
          <p className="text-lg text-[hsl(30,10%,40%)] max-w-md">
            At Barking Glad, we treat every dog like family. Rain or shine, tails are always wagging.
          </p>
          <Button
            className="bg-[hsl(30,80%,50%)] hover:bg-[hsl(30,80%,45%)] text-white text-lg px-8 py-6 rounded-full shadow-lg"
            onClick={() => toast.success("Thanks for your interest! (This is a mockup)")}
          >
            Sign Up for Dog Walking 🐾
          </Button>
        </div>
        <div className="flex-1">
          <img
            src={heroImage}
            alt="Cartoon of a person happily walking a dog in a sunny park"
            className="rounded-2xl shadow-xl w-full max-w-md mx-auto"
          />
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold text-[hsl(145,45%,30%)]">About Barking Glad</h2>
          <p className="text-[hsl(30,10%,40%)] max-w-2xl mx-auto leading-relaxed">
            Founded in 2019 by lifelong dog lover Jamie Woofston, Barking Glad started with one simple
            mission: give every dog the adventure they deserve. Based in sunny Pawsville, we've walked
            over <strong>12,000 dogs</strong> and counting. Our team of certified walkers are background-checked,
            pet first-aid trained, and — most importantly — absolutely dog-obsessed.
          </p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[hsl(145,45%,30%)] mb-10">Our Services</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <Clock size={32} />, title: "30-Min Stroll", price: "$18/walk", desc: "A quick jaunt around the neighborhood — perfect for a midday break." },
            { icon: <MapPin size={32} />, title: "60-Min Adventure", price: "$30/walk", desc: "A full hour at the park with fetch, sniffs, and all the good stuff." },
            { icon: <Heart size={32} />, title: "Puppy Package", price: "$99/week", desc: "5 walks per week for your energetic pup. Includes photo updates!" },
          ].map((s) => (
            <div key={s.title} className="bg-white rounded-xl p-6 shadow-md text-center space-y-3 border border-[hsl(45,30%,88%)]">
              <div className="text-[hsl(30,80%,50%)] flex justify-center">{s.icon}</div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-2xl font-extrabold text-[hsl(145,45%,35%)]">{s.price}</p>
              <p className="text-sm text-[hsl(30,10%,45%)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="bg-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center text-[hsl(145,45%,30%)] mb-10">Happy Customers</h2>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {[
            { name: "Sarah M.", text: "Max used to hate walks. Now he RUNS to the door when he sees the Barking Glad leash!", stars: 5 },
            { name: "Tom & Linda R.", text: "We travel a lot and Barking Glad gives us total peace of mind. The photo updates are adorable.", stars: 5 },
            { name: "Priya K.", text: "Best dog walking service in Pawsville, hands down. Bella is always exhausted and happy after.", stars: 5 },
            { name: "Derek J.", text: "The puppy package is an incredible deal. Our golden retriever has never been more well-behaved!", stars: 4 },
          ].map((r) => (
            <div key={r.name} className="bg-[hsl(45,60%,97%)] rounded-xl p-5 border border-[hsl(45,30%,88%)]">
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-[hsl(45,90%,50%)] text-[hsl(45,90%,50%)]" />
                ))}
              </div>
              <p className="text-sm italic text-[hsl(30,10%,35%)] mb-2">"{r.text}"</p>
              <p className="text-xs font-semibold text-[hsl(30,10%,50%)]">— {r.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(145,45%,30%)] text-white py-8 px-6 text-center text-sm space-y-2">
        <p className="font-bold text-lg">Barking Glad 🐾</p>
        <p>123 Woof Lane, Pawsville, CA 90210</p>
        <p>(555) PAW-WALK · hello@barkingglad.fake</p>
        <p className="text-white/60 text-xs mt-4">This is a mockup — not a real business.</p>
      </footer>
    </div>
  );
};

export default BarkingGlad;
