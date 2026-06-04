import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService, SendMessageDto } from './messages.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to one or more users' })
  send(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user, dto);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get inbox messages' })
  inbox(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getInbox(userId, page, limit);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent messages' })
  sent(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getSent(userId, page, limit);
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  markRead(@Param('messageId') messageId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.markRead(messageId, userId);
  }
}
