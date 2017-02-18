import { domojs } from '../../../devices/device';
export declare namespace deviceTypes {
    class pioneer implements domojs.devices.DeviceType {
        name: string;
        onChange(): string;
        onAdd(): void;
        onSave(data: any): void;
        onServerSave(device: domojs.devices.IDevice, body: any): void;
    }
}
