'use client';

import Hero from '@/components/home/Hero';
import About from '@/components/home/About';
import DestinationGoa from '@/components/home/DestinationGoa';
import DestinationRishikesh from '@/components/home/DestinationRishikesh';
import FeaturedHotels from '@/components/home/FeaturedHotels';
import Amenities from '@/components/home/Amenities';
import FeaturedRooms from '@/components/home/FeaturedRooms';
import WhyChooseUs from '@/components/home/WhyUs';
import Testimonials from '@/components/home/Testimonials';
import Reveal from '@/components/ui/Reveal';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Reveal><About /></Reveal>
      <Reveal direction="left"><DestinationGoa /></Reveal>
      <Reveal direction="right"><DestinationRishikesh /></Reveal>
      <Reveal><FeaturedHotels /></Reveal>
      <Reveal><Amenities /></Reveal>
      <Reveal><FeaturedRooms /></Reveal>
      <Reveal><WhyChooseUs /></Reveal>
      <Reveal><Testimonials /></Reveal>
    </main>
  );
}
