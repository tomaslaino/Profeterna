import Foundation
import Vision
import CoreImage
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let a = CommandLine.arguments
let url = URL(fileURLWithPath: a[1])
let ut = URL(fileURLWithPath: a[2])
let ci = CIImage(contentsOf: url)!
let h = VNImageRequestHandler(ciImage: ci)
let r = VNGenerateForegroundInstanceMaskRequest()
try h.perform([r])
guard let o = r.results?.first else { print("ingen mask"); exit(1) }
let buf = try o.generateMaskedImage(ofInstances: o.allInstances, from: h, croppedToInstancesExtent: false)
let res = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: res, to: ut, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("klar", res.extent)
