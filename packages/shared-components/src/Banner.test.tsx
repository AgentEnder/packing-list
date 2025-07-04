import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { BannerProvider, Banner, useBannerHeight } from './Banner.js';

// Helper component to expose total banner height
const HeightDisplay = () => {
  const height = useBannerHeight();
  return <div data-testid="total-height">{height}</div>;
};

describe('BannerProvider and Banner', () => {
  it('registers banners and calculates offsets', async () => {
    // Force offsetHeight for jsdom
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 20,
    });

    render(
      <BannerProvider>
        <Banner id="one" priority={10} visible className="banner-one">
          Banner 1
        </Banner>
        <Banner id="two" priority={20} visible className="banner-two">
          Banner 2
        </Banner>
        <HeightDisplay />
      </BannerProvider>
    );

    const banner1 = screen.getByText('Banner 1').parentElement?.parentElement
      ?.parentElement as HTMLElement;
    const banner2 = screen.getByText('Banner 2').parentElement?.parentElement
      ?.parentElement as HTMLElement;

    await waitFor(() => {
      expect(banner1.style.bottom).toBe('0px');
      expect(banner2.style.bottom).toBe('20px');
      expect(screen.getByTestId('total-height')).toHaveTextContent('40');
    });
  });
});