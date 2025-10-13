---
title: Go and TPM2.0
lastUpdated: '2025-10-13T20:10:18.565Z'
---

## TPMs

### References

- [A Practical Guide to TPM 2.0](https://library.oapen.org/handle/20.500.12657/28157): A super approachable book that provides an overview of TPM 2.0 - much easier to digest than the hundreds of pages of specifications!
- [TPM Specification](https://trustedcomputinggroup.org/resource/tpm-library-specification/): Specification of the architecture of TPMs, and the commands that are available.
- [TCG EK Credential Profile](https://trustedcomputinggroup.org/wp-content/uploads/TCG-EK-Credential-Profile-V-2.5-R2_published.pdf): Specification for Endorsement Keys and Endorsement Certificates, including their structure and where they shall be stored.

## TPMs in Go

### Libraries

- [go-tpm](https://github.com/google/go-tpm): fairly decent module by Google for communicating with a TPM.
- [go-attestation](https://github.com/google/go-attestation): module by Google which abstracts the individual commands offered by `go-tpm` and offers functionality related to generating an attestation from a TPM and validating that attestation. If your needs are fairly simple, you can usually use this module without directly using `go-tpm`.
- [go-tpm-tools/simulator](https://github.com/google/go-tpm-tools/tree/main/simulator): useful package by Google that does the legwork of spinning up the Microsoft TPM2.0 simulator. Great if you want to write tests for your code that works with TPMs.

### Examples

#### Writing an EKCert to the TPM Simulator

For the purposes of some tests, I needed a TPM which had an EKCert. Unfortunately, the Microsoft TPM simulator does not come with one "installed". So in my test, I create an EKCert, sign it with a CA, and then use the following function to write the bytes of the signed EKCert into the TPM simulator's storage.

```go
package tpm

import (
    "testing"

	tpmsimulator "github.com/google/go-tpm-tools/simulator"
	"github.com/google/go-tpm/legacy/tpm2"
    "github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func writeEKCertToTPM(t *testing.T, sim *tpmsimulator.Simulator, data []byte) {
	// As per TCG Credential Profile EK for TPM 2.0, 2.2.1.4, the RSA 2048
	// EK certificate is stored in the TPM's NV index 0x1c00002.
	const nvramRSAEKCertIndex = 0x1c00002
	err := tpm2.NVDefineSpace(
		sim,
		tpm2.HandlePlatform, // Using Platform Authorization.
		nvramRSAEKCertIndex,
		"", // As this is the simulator, there isn't a password for Platform Authorization.
		"", // We do not configure a password for this index. This allows it to be read using the NV index as the auth handle.
		nil,
		tpm2.AttrPPWrite| // Allows this NV index to be written with platform authorization.
			tpm2.AttrPPRead| // Allows this NV index to be read with platform authorization.
			tpm2.AttrPlatformCreate| // Marks this index as created by the Platform
			tpm2.AttrAuthRead, // Allows the nv index to be used as an auth handle to read itself.

		uint16(len(data)),
	)
	require.NoError(t, err)

	err = tpm2.NVWrite(
		sim,
		tpm2.HandlePlatform,
		nvramRSAEKCertIndex,
		"",
		data,
		0,
	)
	require.NoError(t, err)
}
```

#### `x509: unhandled critical extension` when verifying an EKCert

When verifying an EKCert with Go, you may find that you receive the following error:

```
x509: unhandled critical extension
```

The EKCert may contain information about the TPM within the SAN. As this extension is marked critical and because Go does not have the ability to parse this, it will throw an error when verifying the certificate.

As a workaround, you can "hide" these unhandled critical extensions from Verify:

```go
var sanExtensionOID = []int{2, 5, 29, 17}

var exts []asn1.ObjectIdentifier
for _, ext := range ekCert.UnhandledCriticalExtensions {
	if ext.Equal(sanExtensionOID) {
		continue
	}
	exts = append(exts, ext)
}
