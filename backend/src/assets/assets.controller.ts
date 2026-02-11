import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post()
  async create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto.relativePath);
  }

  @Get()
  async findAll() {
    return this.assetsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
