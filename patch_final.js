const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    let newContent = content;
    if (from instanceof RegExp) {
      newContent = content.replace(from, to);
    } else {
      // Normalize CRLF to LF for both the content and search strings to match reliably on Windows
      const lfContent = content.replace(/\r\n/g, '\n');
      const lfFrom = from.replace(/\r\n/g, '\n');
      const lfTo = to.replace(/\r\n/g, '\n');
      
      if (lfContent.includes(lfFrom)) {
        let replacedLf = lfContent.split(lfFrom).join(lfTo);
        // Put back CRLF if the original file had it
        if (content.includes('\r\n')) {
          newContent = replacedLf.replace(/\n/g, '\r\n');
        } else {
          newContent = replacedLf;
        }
      }
    }
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

// 1. Fix app/(customer)/orders.tsx catch blocks and properties
replaceInFile('app/(customer)/orders.tsx', [
  {
    from: `    } catch (err: unknown) {
      const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || err?.message || 'Gagal memuat pesanan';`,
    to: `    } catch (err: unknown) {
      const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || (err as Error)?.message || 'Gagal memuat pesanan';`
  },
  {
    from: `    } catch (err: unknown) {
      // Handle 409 response with existing payment_id
      if ((err as import("axios").AxiosError)?.response?.status === 409 && err?.response?.data?.data?.payment_id) {
        setLastPaymentId(err.response.data.data.payment_id);
      }
      const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || err?.message || 'Gagal membuat payment';`,
    to: `    } catch (err: unknown) {
      const axiosErr = err as import("axios").AxiosError<{data?: {payment_id: string}, message?: string}>;
      if (axiosErr?.response?.status === 409 && axiosErr?.response?.data?.data?.payment_id) {
        setLastPaymentId(axiosErr.response.data.data.payment_id);
      }
      const msg = axiosErr?.response?.data?.message || (err as Error)?.message || 'Gagal membuat payment';`
  },
  {
    from: `    } catch (err: unknown) {
      const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || err?.message || 'Simulasi payment gagal';`,
    to: `    } catch (err: unknown) {
      const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || (err as Error)?.message || 'Simulasi payment gagal';`
  },
  {
    from: `            } catch (err: unknown) {
              const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || err?.message || 'Gagal menyelesaikan pesanan';`,
    to: `            } catch (err: unknown) {
              const msg = (err as import("axios").AxiosError<{message: string}>)?.response?.data?.message || (err as Error)?.message || 'Gagal menyelesaikan pesanan';`
  }
]);

console.log('\\n✅ Final patches v3 applied successfully!');
