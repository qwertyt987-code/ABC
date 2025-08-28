// Cho TypeScript biết rằng thư viện 'JSZip' sẽ có trên đối tượng window
// vì nó được tải từ CDN trong file index.html.
interface CustomWindow extends Window {
  JSZip?: any;
}
declare const window: CustomWindow;

// Helper chuyển đổi data URL (base64) sang ArrayBuffer
const dataURLtoArrayBuffer = (dataurl: string): ArrayBuffer => {
    const b64 = dataurl.split(',')[1];
    const byteString = atob(b64);
    const buffer = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
        view[i] = byteString.charCodeAt(i);
    }
    return buffer;
}

// Helper tạo chuỗi XML cho hình ảnh sẽ được chèn vào document.xml
const getImageXml = (relationshipId: string, widthEmu: number, heightEmu: number): string => {
    // Đây là cấu trúc XML phức tạp mà Word sử dụng để hiển thị hình ảnh.
    // Các giá trị như ID, kích thước (EMU), và relationshipId được chèn vào.
    return `
    <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="100" name="Drawing from App"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="101" name="Picture"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${relationshipId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${widthEmu}" cy="${heightEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;
};

export const addImageToDoc_and_Download = async (
    docFile: File,
    imageDataUrl: string,
    dimensions: { width: number, height: number }
) => {
    const JSZip = window.JSZip;
    if (!JSZip) {
        console.error("Thư viện 'JSZip' không được tải.");
        alert("Lỗi: Không thể tải thư viện để xử lý file Word.");
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
        try {
            if (!event.target?.result) return;
            const content = event.target.result as ArrayBuffer;

            const zip = await JSZip.loadAsync(content);

            // 1. Thêm file ảnh vào thư mục media
            const imageName = `image_from_canvas_${Date.now()}.png`;
            const imageBuffer = dataURLtoArrayBuffer(imageDataUrl);
            zip.file(`word/media/${imageName}`, imageBuffer);

            // 2. Cập nhật file relationships để Word biết về ảnh mới
            const relsFile = zip.file("word/_rels/document.xml.rels");
            if (!relsFile) {
                throw new Error("Không tìm thấy file document.xml.rels trong tài liệu Word.");
            }
            const relsContent = await relsFile.async("string");
            const parser = new DOMParser();
            const relsXml = parser.parseFromString(relsContent, "application/xml");
            
            // Kiểm tra lỗi phân tích cú pháp XML
            if (relsXml.getElementsByTagName("parsererror").length) {
                throw new Error("Không thể phân tích cú pháp file relationships của Word (document.xml.rels).");
            }

            const relationshipsElement = relsXml.getElementsByTagName("Relationships")[0];
            const relsNamespace = relationshipsElement.namespaceURI;
            if (!relationshipsElement || !relsNamespace) {
                throw new Error("Cấu trúc file document.xml.rels không hợp lệ.");
            }

            // Tìm ID cuối cùng để tạo ID mới, tránh trùng lặp
            const relationships = relationshipsElement.getElementsByTagName("Relationship");
            let lastId = 0;
            for (let i = 0; i < relationships.length; i++) {
                const id = relationships[i].getAttribute("Id");
                if (id?.startsWith("rId")) {
                    const num = parseInt(id.substring(3), 10);
                    if (num > lastId) lastId = num;
                }
            }
            const newRelId = `rId${lastId + 1}`;

            // Tạo thẻ Relationship mới với đúng namespace
            const newRel = relsXml.createElementNS(relsNamespace, "Relationship");
            newRel.setAttribute("Id", newRelId);
            newRel.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image");
            newRel.setAttribute("Target", `media/${imageName}`);
            relationshipsElement.appendChild(newRel);

            const serializer = new XMLSerializer();
            const newRelsContent = serializer.serializeToString(relsXml);
            zip.file("word/_rels/document.xml.rels", newRelsContent);

            // 3. Chèn XML của ảnh vào cuối nội dung tài liệu
            const documentXmlFile = zip.file("word/document.xml");
            if (!documentXmlFile) {
                throw new Error("Không tìm thấy file document.xml trong tài liệu Word.");
            }
            let docContent = await documentXmlFile.async("string");

            // Tính toán kích thước ảnh theo đơn vị EMU (English Metric Units)
            const inchToEmu = 914400;
            const pixelToInch = 1 / 96; // Giả định 96 DPI
            const widthInInch = dimensions.width * pixelToInch;
            const heightInInch = dimensions.height * pixelToInch;
            const widthEmu = Math.round(widthInInch * inchToEmu);
            const heightEmu = Math.round(heightInInch * inchToEmu);

            const imageXml = getImageXml(newRelId, widthEmu, heightEmu);
            
            // Chèn XML của ảnh ngay trước thẻ đóng </w:body>
            const bodyEndTag = docContent.lastIndexOf("</w:body>");
            if (bodyEndTag === -1) {
                throw new Error("Cấu trúc file document.xml không hợp lệ.");
            }
            docContent = docContent.slice(0, bodyEndTag) + imageXml + docContent.slice(bodyEndTag);

            zip.file("word/document.xml", docContent);
            
            // 4. Tạo file .docx mới và tải xuống
            const newDocxBlob = await zip.generateAsync({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            
            const url = URL.createObjectURL(newDocxBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = docFile.name; // Giữ tên file gốc
            document.body.appendChild(a);
            a.click();
            
            // Dọn dẹp
            setTimeout(() => {
              URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }, 100);
            
            alert("Đã thêm ảnh vào file Word và tải xuống thành công!");
        } catch (error) {
            console.error("Không thể chèn ảnh vào file Word:", error);
            alert(`Đã xảy ra lỗi khi xử lý file Word: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    fileReader.onerror = (error) => {
        console.error("Lỗi khi đọc file:", error);
        alert("Đã xảy ra lỗi khi đọc file Word.");
    };

    fileReader.readAsArrayBuffer(docFile);
};