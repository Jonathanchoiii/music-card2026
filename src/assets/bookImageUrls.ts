/**
 * 显式 ?url 导入：避免 import.meta.glob 在部分打包/移动端路径差异导致漏图。
 * 新增/重命名贺卡图时请在此同步文件名。（j9 不参与内页；文件可留在目录但不导入以减小包体）
 */
import coverUrl from './book-images/cover.png?url'
import cover2Url from './book-images/cover2.png?url'
import j1Url from './book-images/j1.png?url'
import j10Url from './book-images/j10.png?url'
import j2Url from './book-images/j2.png?url'
import j3Url from './book-images/j3.png?url'
import j4Url from './book-images/j4.png?url'
import j5Url from './book-images/j5.png?url'
import j6Url from './book-images/j6.png?url'
import j7Url from './book-images/j7.png?url'
import j8Url from './book-images/j8.png?url'
import vibeCoverUrl from './book-images/vibe cover.png?url'

export const BOOK_IMAGE_URLS: Record<string, string> = {
  'cover.png': coverUrl,
  'cover2.png': cover2Url,
  'j1.png': j1Url,
  'j2.png': j2Url,
  'j3.png': j3Url,
  'j4.png': j4Url,
  'j5.png': j5Url,
  'j6.png': j6Url,
  'j7.png': j7Url,
  'j8.png': j8Url,
  'j10.png': j10Url,
  'vibe cover.png': vibeCoverUrl,
}
