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

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <DestinationGoa />
      <DestinationRishikesh />
      <FeaturedHotels />
      <Amenities />
      <FeaturedRooms />
      <WhyChooseUs />
      <Testimonials />
    </main>
  );
}
