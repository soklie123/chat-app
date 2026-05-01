declare module "multer-storage-cloudinary" {
  import { StorageEngine } from "multer";
  import { v2 as Cloudinary } from "cloudinary";

  interface CloudinaryStorageOptions {
    cloudinary: typeof Cloudinary;
    params?: any;
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(req: any, file: any, callback: any): void;
    _removeFile(req: any, file: any, callback: any): void;
  }
}