import { BadGatewayException, Injectable } from '@nestjs/common';

const WHEELSEYE_URL =
  'https://api.wheelseye.com/currentLoc?accessToken=69039e62-a011-4321-beda-48411103d489';

interface WheelseyeResponse {
  data?: { list?: unknown[] };
}

@Injectable()
export class WheelseyeService {
  async fetchLocations(): Promise<unknown[]> {
    const res = await fetch(WHEELSEYE_URL);
    if (!res.ok) throw new BadGatewayException('Wheelseye API error');
    const result = (await res.json()) as WheelseyeResponse;
    if (!result?.data || !Array.isArray(result.data.list)) {
      throw new BadGatewayException('Invalid data format from API');
    }
    return result.data.list;
  }
}
