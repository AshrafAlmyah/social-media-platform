import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
  ) {}

  async create(relativePath: string): Promise<Asset> {
    const asset = this.assetsRepository.create({ relativePath });
    return this.assetsRepository.save(asset);
  }

  async findAll(): Promise<Asset[]> {
    return this.assetsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetsRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const asset = await this.findOne(id);
    await this.assetsRepository.remove(asset);
    await this.deleteFileIfExists(asset.relativePath);
    return { success: true };
  }

  async removeByRelativePath(pathOrUrl: string): Promise<{ success: boolean }> {
    const relativePath = this.normalizeRelativePath(pathOrUrl);
    if (!relativePath) {
      return { success: false };
    }
    const asset = await this.assetsRepository.findOne({
      where: { relativePath },
    });
    if (asset) {
      await this.assetsRepository.remove(asset);
    }
    await this.deleteFileIfExists(relativePath);
    return { success: true };
  }

  private normalizeRelativePath(pathOrUrl: string): string | null {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('http')) {
      try {
        const url = new URL(pathOrUrl);
        return url.pathname;
      } catch {
        return null;
      }
    }
    return pathOrUrl;
  }

  private async deleteFileIfExists(relativePath: string) {
    const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    if (!normalized.startsWith('uploads/')) {
      return;
    }
    const fileName = basename(normalized);
    const filePath = join(process.cwd(), 'uploads', fileName);
    if (!existsSync(filePath)) {
      return;
    }
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore file delete errors to avoid blocking DB cleanup
    }
  }
}
