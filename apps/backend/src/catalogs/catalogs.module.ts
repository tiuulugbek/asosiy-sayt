import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { CatalogsController, CatalogLegacyController, ProductCategoriesAliasController } from './catalogs.controller';

@Module({
  controllers: [CatalogsController, CatalogLegacyController, ProductCategoriesAliasController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}


